


#include "stm32l4xx_hal.h"
#include "uartRingBufDMA.h"
#include "string.h"

#include <stdlib.h>

extern UART_HandleTypeDef huart2;
extern DMA_HandleTypeDef hdma_usart2_rx;

#define UART huart2
#define DMA hdma_usart2_rx

/* Define the Size Here */
#define RxBuf_SIZE 512
#define MainBuf_SIZE 1024

uint8_t RxBuf[RxBuf_SIZE];
extern uint8_t MainBuf[MainBuf_SIZE];

uint16_t oldPos = 0;
uint16_t newPos = 0;

uint16_t Head, Tail;

int isDataAvailable = 0;

int isOK = 0;

/* Timeout is in milliseconds */
int32_t TIMEOUT = 0;

/* Initialize the Ring Buffer */
void Ringbuf_Init (void)
{
	memset(RxBuf, '\0', RxBuf_SIZE);
	memset(MainBuf, '\0', MainBuf_SIZE);

	Head = Tail = 0;
	oldPos = 0;
	newPos = 0;

  HAL_UARTEx_ReceiveToIdle_DMA(&UART, RxBuf, RxBuf_SIZE);
  __HAL_DMA_DISABLE_IT(&DMA, DMA_IT_HT);
}

/* Resets the Ring buffer */
void Ringbuf_Reset (void)
{
	memset(MainBuf,'\0', MainBuf_SIZE);
	memset(RxBuf, '\0', RxBuf_SIZE);
	Tail = 0;
	Head = 0;
	oldPos = 0;
	newPos = 0;
	isOK = 0;
}


void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef *huart, uint16_t Size)
{
		isDataAvailable = 1;

		oldPos = newPos;  // Update the last position before copying new data

		/* If the data in large and it is about to exceed the buffer size, we have to route it to the start of the buffer
		 * This is to maintain the circular buffer
		 * The old data in the main buffer will be overlapped
		 */
		if (oldPos+Size > MainBuf_SIZE)  // If the current position + new data size is greater than the main buffer
		{
			uint16_t datatocopy = MainBuf_SIZE-oldPos;  // find out how much space is left in the main buffer
			memcpy ((uint8_t *)MainBuf+oldPos, (uint8_t *)RxBuf, datatocopy);  // copy data in that remaining space

			oldPos = 0;  // point to the start of the buffer
			memcpy ((uint8_t *)MainBuf, (uint8_t *)RxBuf+datatocopy, (Size-datatocopy));  // copy the remaining data
			newPos = (Size-datatocopy);  // update the position
		}

		/* if the current position + new data size is less than the main buffer
		 * we will simply copy the data into the buffer and update the position
		 */
		else
		{
			memcpy ((uint8_t *)MainBuf+oldPos, (uint8_t *)RxBuf, Size);
			newPos = Size+oldPos;
		}

		/* Update the position of the Head
		 * If the current position + new size is less then the buffer size, Head will update normally
		 * Or else the head will be at the new position from the beginning
		 */
		if (Head+Size < MainBuf_SIZE) Head = Head+Size;
		else Head = Head+Size - MainBuf_SIZE;

		/* start the DMA again */
		HAL_UARTEx_ReceiveToIdle_DMA(&UART, (uint8_t *) RxBuf, RxBuf_SIZE);
		__HAL_DMA_DISABLE_IT(&DMA, DMA_IT_HT);


	/****************** PROCESS (Little) THE DATA HERE *********************
	 * This is the PART OF  "isConfirmed" Function
	 */

	/* Let's say we want to check for the keyword "OK" within our incoming DATA */
	for (int i=0; i<Size; i++)
	{
		if ((RxBuf[i] == '*'))
		{
			isOK = 1;
		}
	}
}







