#include "stm32l4xx_hal.h"
#include "uartRingBufDMA.h"
#include "string.h"
#include <stdlib.h>

// Define the UART1 and UART2 handles and DMA handles
extern UART_HandleTypeDef huart2;
extern DMA_HandleTypeDef hdma_usart2_rx;

#define MAIN_BUF_SIZE_UART2 1024
#define RX_BUF_SIZE_UART2 512

// Variables for UART2
uint8_t MainBuf_UART2[MAIN_BUF_SIZE_UART2];
uint8_t RxBuf_UART2[RX_BUF_SIZE_UART2];
uint16_t oldPos_UART2 = 0;
uint16_t newPos_UART2 = 0;

uint16_t Head_UART2, Tail_UART2;

/* Define the Size Here */
#define RxBuf_SIZE 512
#define MainBuf_SIZE 1024

// Shared variables (for processing, etc.)
int32_t TIMEOUT = 0;
int isDataAvailable = 0;

/* Initialize the Ring Buffer */
void Ringbuf_Init(void) {

    memset(RxBuf_UART2, '\0', RX_BUF_SIZE_UART2);
    memset(MainBuf_UART2, '\0', MAIN_BUF_SIZE_UART2);
    oldPos_UART2 = 0;
    newPos_UART2 = 0;
    HAL_UARTEx_ReceiveToIdle_DMA(&huart2, RxBuf_UART2, RX_BUF_SIZE_UART2);
    __HAL_DMA_DISABLE_IT(&hdma_usart2_rx, DMA_IT_HT);
}

/* Resets the Ring buffer */
void Ringbuf_Reset(UART_HandleTypeDef *huart) {
	memset(MainBuf_UART2, '\0', MAIN_BUF_SIZE_UART2);
	memset(RxBuf_UART2, '\0', RX_BUF_SIZE_UART2);
	Tail_UART2 = 0;
	Head_UART2 = 0;
	newPos_UART2 = 0;

}

void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef *huart, uint16_t Size) {
    isDataAvailable = 1;

    // Update oldPos and newPos based on the UART

	oldPos_UART2 = newPos_UART2;
	memcpy((uint8_t *)MainBuf_UART2 + oldPos_UART2, (uint8_t *)RxBuf_UART2, Size);
	newPos_UART2 = (oldPos_UART2 + Size) % MAIN_BUF_SIZE_UART2;

	// Update Head based on the UART
	if (Head_UART2 + Size < MAIN_BUF_SIZE_UART2)
		Head_UART2 = Head_UART2 + Size;
	else
		Head_UART2 = Head_UART2 + Size - MAIN_BUF_SIZE_UART2;

	HAL_UARTEx_ReceiveToIdle_DMA(&huart2, (uint8_t *)RxBuf_UART2, RX_BUF_SIZE_UART2);
	__HAL_DMA_DISABLE_IT(&hdma_usart2_rx, DMA_IT_HT);
}
