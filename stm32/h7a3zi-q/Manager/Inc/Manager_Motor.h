#ifndef MANAGER_MOTOR_H
#define MANAGER_MOTOR_H

#include "Periph_Motors.h"
#include "main.h"

/***********************************************/
// Define to disable motor and bypass security
// #define MMOT_DEV_MOTOR_1_DISABLE
// #define MMOT_DEV_MOTOR_2_DISABLE
// #define MMOT_DEV_MOTOR_3_DISABLE
/***********************************************/

#define MMOT_MOTOR_NBR 3
#define MMOT_MOTOR_1   1
#define MMOT_MOTOR_2   0
#define MMOT_MOTOR_3   2

#define MMOT_STATE_WAITING_SECURITY 1
#define MMOT_STATE_START_MOTORS     2
#define MMOT_STATE_READY2MOVE       5
#define MMOT_STATE_ERROR            6

void ManagerMotor_Init();
void ManagerMotor_Reset();
void ManagerMotor_Task();

Motor* ManagerMotor_GetMotorData(uint8_t id);
bool   ManagerMotor_IsReady2Move();
bool   ManagerMotor_IsGoalStateReady(uint8_t id);

void ManagerMotor_MovePosOld(uint8_t id, float pos);
void ManagerMotor_MoveSpeed(uint8_t id, float speed);
void ManagerMotor_MovePosSpeed(uint8_t id, float pos, float speed);
void ManagerMotor_MovePosSpeedTorque(uint8_t id, float pos, float speed, float torque);

bool    ManagerMotor_IsWaitingSecurity();
void    ManagerMotor_SecurityPassed();
void    ManagerMotor_SetError();
bool    ManagerMotor_InError();
uint8_t ManagerMotor_GetState();
void    ManagerMotor_StopManualMovement(uint8_t motorindex);

void ManagerMotor_SoftwareOrigin(uint8_t id);
void ManagerMotor_SetMotorOrigin(uint8_t id);
void ManagerMotor_SetOriginShift(uint8_t id, float shiftValue);

#endif
