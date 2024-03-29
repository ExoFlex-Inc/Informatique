#ifndef MANAGER_MOTOR_H
#define MANAGER_MOTOR_H

#include "Periph_Motors.h"
#include "main.h"

#define MMOT_MOTOR_NBR 3
#define MMOT_MOTOR_1   0
#define MMOT_MOTOR_2   1
#define MMOT_MOTOR_3   2

#define MMOT_STATE_WAITING_SECURITY  1
#define MMOT_STATE_START_MOTORS  2
#define MMOT_STATE_SET_ORIGIN 3
#define MMOT_STATE_READY2MOVE 4
#define MMOT_STATE_ERROR      5


void ManagerMotor_Init();
void ManagerMotor_Reset();
void ManagerMotor_Task();

void    ManagerMotor_SetMotorGoal(uint8_t motorIndex, float goal);
Motor*  ManagerMotor_GetMotorData(uint8_t motorIndex);
bool    ManagerMotor_IsReady2Move();
bool    ManagerMotor_IsGoalStateReady(uint8_t motorIndex);
void    ManagerMotor_SetMotorGoalState(uint8_t motorIndex, bool readyState);

bool ManagerMotor_IsWaitingSecurity();
void ManagerMotor_SecurityPassed();
void ManagerMotor_SetError();
bool ManagerMotor_InError();
uint8_t ManagerMotor_GetState();


#endif
