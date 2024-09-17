/*
 * Periph_UartRingBuf.h
 *
 *  Created on: Aug 12, 2021
 *      Author: controllerstech.com
 */

#ifndef INC_PERIPH_UARTRINGBUF_H_
#define INC_PERIPH_UARTRINGBUF_H_

#define PUART_RX_BUF_SIZE 512

#include <stdint.h>

#include "main.h"

/* Initialize the Ring buffer
 * It will also initialize the UART RECEIVE DMA
 * */
void PeriphUartRingBuf_Init();
void PeriphUartRingBuf_Read(char* buf, uint32_t* size);
void PeriphUartRingBuf_Send(char* buf, uint32_t size);
void PeriphUartRingBuf_ReadJson(char* buf, uint32_t* size);
void PeriphUartRingBuf_ReadJson(char* buf, uint32_t* size);
uint32_t PeriphUartRingBuf_GetRxTimerDelay();

#endif /* INC_PERIPH_UARTRINGBUF_H_ */
