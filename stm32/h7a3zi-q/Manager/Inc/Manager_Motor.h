#ifndef MANAGER_MOTOR_H
#define MANAGER_MOTOR_H

#include "Periph_Motors.h"
#include "main.h"

#define MOTOR_NBR 3
#define MOTOR_1   0
#define MOTOR_2   1
#define MOTOR_3   2

// States
#define CAN_VERIF  0
#define SET_ORIGIN 1
#define READY2MOVE 2
#define ERROR      3

void ManagerMotor_Init();
void ManagerMotor_Task();

void    ManagerMotor_SetMotorGoal(uint8_t motorIndex, float goal);
Motor*  ManagerMotor_GetMotorData(uint8_t motorIndex);
uint8_t ManagerMotor_GetState();
bool    ManagerMotor_IsGoalStateReady(uint8_t motorIndex);
void    ManagerMotor_SetMotorGoalState(uint8_t motorIndex, bool readyState);

#endif
