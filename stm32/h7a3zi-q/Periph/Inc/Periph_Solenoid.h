/*
 * Periph_Soleinoid.h
 *
 *  Created on: Oct 09, 2024
 *      Author: Nicolas
 */

#ifndef INC_PERIPH_SOLEINOID_H_
#define INC_PERIPH_SOLEINOID_H_

#include "main.h"

void PeriphSolenoid_Init();
void PeriphSolenoid_ResetLocksState();

bool PeriphSolenoid_UnlockChangeSide();
bool PeriphSolenoid_UnlockEversion();

bool PeriphSolenoid_LockChangeSide();
bool PeriphSolenoid_LockEversion();

void periphSolenoid_FootThight();
void periphSolenoid_FootLoose();

void PeriphSolenoid_StopPWMs();

#endif /* INC_PERIPH_SOLEINOID_H_ */
