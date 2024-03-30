/*
 * Canbus.h
 *
 *  Created on: Feb 26, 2024
 *      Author: Charles Henri
 */

#ifndef INC_PERIPH_CANBUS_H_
#define INC_PERIPH_CANBUS_H_

#include "main.h"

void PeriphCanbus_Init();
void PeriphCanbus_TransmitDLC8(uint32_t id, uint8_t* data);
bool PeriphCanbus_GetNodeMsg(uint8_t id, uint8_t* data, uint32_t *timeOfMsg);

#endif /* INC_PERIPH_CANBUS_H_ */
