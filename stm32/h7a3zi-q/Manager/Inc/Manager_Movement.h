#ifndef MANAGER_MOVEMENT_H
#define MANAGER_MOVEMENT_H

#include "main.h"

#define MMOV_RIGTH 1
#define MMOV_LEFT  -1
#define MMOV_UP    1
#define MMOV_DOWN  -1

// States
#define MMOV_STATE_WAITING_SECURITY      1
#define MMOV_STATE_HOMING    3
#define MMOV_STATE_MANUAL    4
#define MMOV_STATE_AUTOMATIC 5
#define MMOV_STATE_ERROR 6

void ManagerMovement_Init();
void ManagerMovement_Reset();
void ManagerMovement_Task();

// Utilities
uint8_t ManagerMovement_GetState();
void    ManagerMovement_SetState(uint8_t state);

// Auto Setup
void ManagerMovement_AddExercise(uint8_t exerciseIdx, uint8_t exerciseType,
                                 uint8_t reps, float eTime, float pTime);
void ManagerMovement_SetFinalPos(uint8_t exerciseIdx, float finalPosition);
void ManagerMovement_ResetExercise();

// Auto buttons
void ManagerMovement_StartExercise();
void ManagerMovement_StopExercise();
void ManagerMovement_NextExercise();

// Movement commands
void ManagerMovement_ManualCmdEversion(int8_t direction);
void ManagerMovement_ManualCmdDorsiflexion(int8_t direction);
void ManagerMovement_ManualCmdExtension(int8_t direction);
void ManagerMovement_ManualCmdHome(uint8_t motorIndex);
void ManagerMovement_ManualCmdHomeAll();

bool ManagerMovement_IsWaitingSecurity();
void ManagerMovement_SecurityPassed();
void ManagerMovement_SetError();
bool ManagerMovement_InError();


uint8_t ManagerMovement_GetState();

#endif
