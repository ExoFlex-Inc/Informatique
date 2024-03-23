/*
 * Periph_UartRingBuf.h
 *
 *  Created on: Aug 12, 2021
 *      Author: controllerstech.com
 */

#ifndef INC_PERIPH_UARTRINGBUF_H_
#define INC_PERIPH_UARTRINGBUF_H_

#include "main.h"
#include <stdint.h>


/* Initialize the Ring buffer
 * It will also initialize the UART RECEIVE DMA
 * */
void PeriphUartRingBuf_Init();
void PeriphUartRingBuf_Read(char *buf, uint32_t *size);
void PeriphUartRingBuf_Send(char * buf, uint32_t size);
void PeriphUartRingBuf_ReadJson(char *buf, uint32_t *size);



#endif /* INC_PERIPH_UARTRINGBUF_H_ */
