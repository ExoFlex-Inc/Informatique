#ifndef MANAGER_MOTOR_H
#define MANAGER_MOTOR_H

#include "main.h"
#include "Periph_Motors.h"

#define MOTOR_NBR 3
#define MOTOR_1   0
#define MOTOR_2   1
#define MOTOR_3   2


void ManagerMotor_Init();
void ManagerMotor_Task();

void ManagerMotor_SetMotorNextPos(uint8_t motorIndex, float nextPos);
void ManagerMotor_GetMotorData(uint8_t motorIndex, const Motor* pMotor);

#endif
