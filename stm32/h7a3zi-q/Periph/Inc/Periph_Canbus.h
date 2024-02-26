/*
 * Canbus.h
 *
 *  Created on: Feb 26, 2024
 *      Author: Charles Henri
 */

#ifndef INC_PERIPH_CANBUS_H_
#define INC_PERIPH_CANBUS_H_

#ifdef __cplusplus
extern "C" {
#endif

#include "main.h"



void PeriphCanbus_Init();
void PeriphCanbus_TransmitDLC8(uint32_t id, uint8_t* data);
uint8_t PeriphCanbus_ExtractControllerID(uint32_t ext_id);

#ifdef __cplusplus
}
#endif

#endif /* INC_PERIPH_CANBUS_H_ */
