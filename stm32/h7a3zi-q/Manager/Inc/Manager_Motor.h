#ifndef MANAGER_MOTOR_H
#define MANAGER_MOTOR_H

#include "Periph_Motors.h"
#include "main.h"

#define MMOT_MOTOR_NBR 3
#define MMOT_MOTOR_1   0
#define MMOT_MOTOR_2   1
#define MMOT_MOTOR_3   2

// States


void ManagerMotor_Init();
void ManagerMotor_Task();

void    ManagerMotor_SetMotorGoal(uint8_t motorIndex, float goal);
Motor*  ManagerMotor_GetMotorData(uint8_t motorIndex);
bool    ManagerMotor_IsReady2Move();
bool    ManagerMotor_IsGoalStateReady(uint8_t motorIndex);
void    ManagerMotor_SetMotorGoalState(uint8_t motorIndex, bool readyState);

bool ManagerMotor_WaitingSecPass();
void ManagerMotor_PassSec();
void ManagerMotor_SetError();
bool ManagerMotor_InError();
void ManagerMotor_Reset();


#endif
