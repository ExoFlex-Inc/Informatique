/*
 * Periph_Soleinoid.h
 *
 *  Created on: Oct 09, 2024
 *      Author: Nicolas
 */

#ifndef INC_PERIPH_SOLEINOID_H_
#define INC_PERIPH_SOLEINOID_H_

#include "main.h"

bool PeriphSolenoid_UnlockChangeSide();
bool PeriphSolenoid_UnlockEversion();

bool PeriphSolenoid_LockChangeSide();
bool PeriphSolenoid_LockEversion();
void PeriphSolenoid_StopPWMs();

#endif /* INC_PERIPH_SOLEINOID_H_ */
