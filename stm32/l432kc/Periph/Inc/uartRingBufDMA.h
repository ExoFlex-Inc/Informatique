/*
 * uartRingBufDMA.h
 *
 *  Created on: Aug 12, 2021
 *      Author: controllerstech.com
 */

#ifndef INC_UARTRINGBUFDMA_H_
#define INC_UARTRINGBUFDMA_H_

#include "main.h"
#include <stdint.h>


/* Initialize the Ring buffer
 * It will also initialize the UART RECEIVE DMA
 * */
void Ringbuf_Init ();




#endif /* INC_UARTRINGBUFDMA_H_ */
