#ifndef MANAGER_MOTOR_HMI_H
#define MANAGER_MOTOR_HMI_H

#include "main.h"
#include "Periph_Canbus.h"
#include "Periph_Motors.h"

typedef struct
{
	Motor motor;
	uint8_t temp;
	uint8_t error;
	float   nextPosition;
	bool    detected;
} MotorInfo;

void ManagerMotorHMI_Init();
void ManagerMotorHMI_Task();

#endif
