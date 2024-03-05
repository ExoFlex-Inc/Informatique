#ifndef MANAGER_MOTOR_HMI_H
#define MANAGER_MOTOR_HMI_H

#include "Periph_Canbus.h"
#include "Periph_Motors.h"
#include "main.h"

typedef struct
{
    Motor   motor;
    uint8_t temp;
    uint8_t error;
    float   nextPosition;
    bool    detected;
} MotorInfo;

void ManagerMotor_Init();
void ManagerMotor_Task();

#endif
