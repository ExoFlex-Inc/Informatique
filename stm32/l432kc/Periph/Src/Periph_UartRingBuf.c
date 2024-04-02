#include <Periph_UartRingBuf.h>
#include <stdlib.h>
#include <stdbool.h>

#include "string.h"

// Define the UART1 and UART2 handles and DMA handles
extern UART_HandleTypeDef huart2;
extern DMA_HandleTypeDef  hdma_usart2_rx;

#define RX_BUF_SIZE 512

// Variables for UART2
uint8_t rxBuf[RX_BUF_SIZE];

uint16_t head, tail, peak;
bool     foundJsonStart;
bool     foundJsonEnd;

void PeriphUartRingBuf_AdvanceHead(uint32_t bytesReceived);
void PeriphUartRingBuf_GetJsonStart();
void PeriphUartRingBuf_GetJsonEnd();
void PeriphUartRingBuf_ReadTailToPeak(char* buf, uint32_t* size);

void PeriphUartRingBuf_Init()
{
    memset(rxBuf, '\0', RX_BUF_SIZE);
    HAL_UARTEx_ReceiveToIdle_DMA(&huart2, rxBuf, RX_BUF_SIZE);
    head           = 0;
    tail           = 0;
    peak           = 0;
    foundJsonStart = false;
    foundJsonEnd   = false;
}

void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef* huart, uint16_t Size)
{
    HAL_UART_RxEventTypeTypeDef event = HAL_UARTEx_GetRxEventType(huart);
    uint32_t                    bytesReceived = 0;

    if (event == HAL_UART_RXEVENT_TC)
    {
        bytesReceived = RX_BUF_SIZE - head;
    }
    else
    {
        bytesReceived =
            RX_BUF_SIZE - __HAL_DMA_GET_COUNTER(huart->hdmarx) - head;
    }

    if (bytesReceived < 0)
    {
        Error_Handler();
    }

    PeriphUartRingBuf_AdvanceHead(bytesReceived);
}

// code used to increment the head and discard old data
// by advancing the tail
void PeriphUartRingBuf_AdvanceHead(uint32_t bytesReceived)
{
    while (bytesReceived--)
    {
        head++;
        if (head == RX_BUF_SIZE)
        {
            head = 0;
        }
        if (head == tail)
        {
            // this will discard the oldest data
            tail++;
            if (tail == RX_BUF_SIZE)
            {
                tail = 0;
            }
        }
        if (head == peak)
        {
            // this will discard the oldest data
            peak++;
            if (peak == RX_BUF_SIZE)
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
        if (tail == RX_BUF_SIZE)
        {
            tail = 0;
        }
    }
}

void PeriphUartRingBuf_Send(char* buf, uint32_t size)
{
    HAL_UART_Transmit(&huart2, (uint8_t*) buf, size, 20);
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
        if (tail == RX_BUF_SIZE)
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
            if (peak == RX_BUF_SIZE)
            {
                peak = 0;
            }
            break;
        }
        peak++;
        if (peak == RX_BUF_SIZE)
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
        if (tail == RX_BUF_SIZE)
        {
            tail = 0;
        }
    }
}
