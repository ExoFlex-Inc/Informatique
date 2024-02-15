#include "stm32h7xx_hal.h"
#include "uartRingBufDMA.h"
#include "string.h"
#include <stdlib.h>



uint16_t oldPos_UART = 0;
uint16_t newPos_UART = 0;

uint16_t Head_UART, Tail_UART;

/* Define the Size Here */
#define RxBuf_SIZE 512
#define MainBuf_SIZE 1024

// Shared variables (for processing, etc.)
int32_t TIMEOUT = 0;
int isDataAvailable = 0;

/* Initialize the Ring Buffer */
void Ringbuf_Init(void) {

    memset(RxBuf_UART, '\0', RX_BUF_SIZE_UART);
    memset(MainBuf_UART, '\0', MAIN_BUF_SIZE_UART);
    oldPos_UART = 0;
    newPos_UART = 0;
    HAL_UARTEx_ReceiveToIdle_DMA(&huart3, RxBuf_UART, RX_BUF_SIZE_UART);
    __HAL_DMA_DISABLE_IT(&hdma_usart3_rx, DMA_IT_HT);
}

/* Resets the Ring buffer */
void Ringbuf_Reset(UART_HandleTypeDef *huart) {
	memset(MainBuf_UART, '\0', MAIN_BUF_SIZE_UART);
	memset(RxBuf_UART, '\0', RX_BUF_SIZE_UART);
	Tail_UART = 0;
	Head_UART = 0;
	newPos_UART = 0;

}

void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef *huart, uint16_t Size) {
    isDataAvailable = 1;

    // Update oldPos and newPos based on the UART

	oldPos_UART = newPos_UART;
	memcpy((uint8_t *)MainBuf_UART + oldPos_UART, (uint8_t *)RxBuf_UART, Size);
	newPos_UART = (oldPos_UART + Size) % MAIN_BUF_SIZE_UART;

	// Update Head based on the UART
	if (Head_UART + Size < MAIN_BUF_SIZE_UART)
		Head_UART = Head_UART + Size;
	else
		Head_UART = Head_UART + Size - MAIN_BUF_SIZE_UART;

	HAL_UARTEx_ReceiveToIdle_DMA(&huart3, (uint8_t *)RxBuf_UART, RX_BUF_SIZE_UART);
	__HAL_DMA_DISABLE_IT(&hdma_usart3_rx, DMA_IT_HT);
}
