/*
 * Periph_Switch.h
 *
 *  Created on: Feb 27, 2024
 *      Author: Charles Henri
 */

#ifndef INC_PERIPH_SWITCH_H_
#define INC_PERIPH_SWITCH_H_

#include "main.h"

void PeriphSwitch_Task();

bool PeriphSwitch_LegLeft();
bool PeriphSwitch_LegRight();
bool PeriphSwitch_ExtensionUp();
bool PeriphSwitch_ExtensionDown();
bool PeriphSwitch_DorsiflexionUp();
bool PeriphSwitch_DorsiflexionDown();
bool PeriphSwitch_EversionLeft();
bool PeriphSwitch_EversionRight();
bool PeriphSwitch_AnySwitch();

#endif /* INC_PERIPH_SWITCH_H_ */
