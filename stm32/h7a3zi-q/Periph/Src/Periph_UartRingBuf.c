#include <Periph_UartRingBuf.h>
#include <stdlib.h>

#include "string.h"

// Define the UART1 and UART2 handles and DMA handles
extern UART_HandleTypeDef huart3;
extern DMA_HandleTypeDef  hdma_usart2_rx;

// Variables for UART2
uint8_t rxBuf[PUART_RX_BUF_SIZE];

uint16_t head, tail, peak;
uint32_t rxTimerDelay, timerHalReset;
bool     foundJsonStart;
bool     foundJsonEnd;
bool     msgSent;

void PeriphUartRingBuf_AdvanceHead(uint32_t bytesReceived);
void PeriphUartRingBuf_GetJsonStart();
void PeriphUartRingBuf_GetJsonEnd();
void PeriphUartRingBuf_ReadTailToPeak(char* buf, uint32_t* size);
void PeriphUartRingBuf_ResetRxTimerDelay();

void PeriphUartRingBuf_Init()
{
    memset(rxBuf, '\0', PUART_RX_BUF_SIZE);
    HAL_UARTEx_ReceiveToIdle_DMA(&huart3, rxBuf, PUART_RX_BUF_SIZE);
    head           = 0;
    tail           = 0;
    peak           = 0;
    foundJsonStart = false;
    foundJsonEnd   = false;
    rxTimerDelay   = 0;
    timerHalReset  = 0;
    msgSent        = true;
}

void PeriphUartRingBuf_Task()
{
    rxTimerDelay = HAL_GetTick() - timerHalReset;
}

void HAL_UART_TxCpltCallback(UART_HandleTypeDef* huart)
{
    msgSent = true;
}

void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef* huart, uint16_t Size)
{
    HAL_UART_RxEventTypeTypeDef event = HAL_UARTEx_GetRxEventType(huart);
    uint32_t                    bytesReceived = 0;

    if (event == HAL_UART_RXEVENT_TC)
    {
        bytesReceived = PUART_RX_BUF_SIZE - head;
    }
    else
    {
        bytesReceived =
            PUART_RX_BUF_SIZE - __HAL_DMA_GET_COUNTER(huart->hdmarx) - head;
    }

    if (bytesReceived < 0)
    {
        Error_Handler();
    }

    PeriphUartRingBuf_AdvanceHead(bytesReceived);
    PeriphUartRingBuf_ResetRxTimerDelay();
}

// code used to increment the head and discard old data
// by advancing the tail
void PeriphUartRingBuf_AdvanceHead(uint32_t bytesReceived)
{
    while (bytesReceived--)
    {
        head++;
        if (head == PUART_RX_BUF_SIZE)
        {
            head = 0;
        }
        if (head == tail)
        {
            // this will discard the oldest data
            tail++;
            if (tail == PUART_RX_BUF_SIZE)
            {
                tail = 0;
            }
        }
        if (head == peak)
        {
            // this will discard the oldest data
            peak++;
            if (peak == PUART_RX_BUF_SIZE)
            {
                peak = 0;
            }
        }
    }
}

// you don't want any UART interrupts happening during this time
// also make sure output buffer is >= fifo_size or limit the
// number of bytes read
void PeriphUartRingBuf_Read(char* buf, uint32_t* size)
{
    *size = 0;
    while (tail != head)
    {
        *(buf++) = rxBuf[tail];
        tail++;
        (*size)++;
        if (tail == PUART_RX_BUF_SIZE)
        {
            tail = 0;
        }
    }
}

void PeriphUartRingBuf_Send(char* buf, uint16_t size)
{
    if (msgSent)
    {
        static char bufStat[PUART_TX_BUF_SIZE];

        for (uint16_t i = 0; i < size; i++)
        {
            bufStat[i] = buf[i];
        }

        HAL_UART_Transmit_IT(&huart3, (uint8_t*) bufStat, size);
        msgSent = false;
    }
}

void PeriphUartRingBuf_ReadJson(char* buf, uint32_t* size)
{
    *size = 0;

    if (!foundJsonStart)
    {
        PeriphUartRingBuf_GetJsonStart();
    }

    if (foundJsonStart)
    {
        PeriphUartRingBuf_GetJsonEnd();
    }

    if (foundJsonStart && foundJsonEnd)
    {
        PeriphUartRingBuf_ReadTailToPeak(buf, size);
        foundJsonStart = false;
        foundJsonEnd   = false;
    }
}

void PeriphUartRingBuf_GetJsonStart()
{
    while (tail != head)
    {
        if (rxBuf[tail] == '{')
        {
            foundJsonStart = true;
            peak           = tail;
            break;
        }
        tail++;
        if (tail == PUART_RX_BUF_SIZE)
        {
            tail = 0;
        }
    }
}

void PeriphUartRingBuf_GetJsonEnd()
{
    while (peak != head)
    {
        if (rxBuf[peak] == '}')
        {
            foundJsonEnd = true;
            peak++;
            if (peak == PUART_RX_BUF_SIZE)
            {
                peak = 0;
            }
            break;
        }
        peak++;
        if (peak == PUART_RX_BUF_SIZE)
        {
            peak = 0;
        }
    }
}

void PeriphUartRingBuf_ReadTailToPeak(char* buf, uint32_t* size)
{
    *size = 0;
    while (tail != peak)
    {
        *(buf++) = rxBuf[tail];
        tail++;
        (*size)++;
        if (tail == PUART_RX_BUF_SIZE)
        {
            tail = 0;
        }
    }
}

uint32_t PeriphUartRingBuf_GetRxTimerDelay()
{
    return rxTimerDelay;
}

void PeriphUartRingBuf_ResetRxTimerDelay()
{
    timerHalReset = HAL_GetTick();
    rxTimerDelay  = 0;
}
