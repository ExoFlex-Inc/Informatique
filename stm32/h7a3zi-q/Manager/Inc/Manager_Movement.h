#ifndef MANAGER_MOVEMENT_H
#define MANAGER_MOVEMENT_H

#include "main.h"

#define MMOV_RIGTH -1
#define MMOV_LEFT  1
#define MMOV_UP    -1
#define MMOV_DOWN  1

// States
#define MMOV_STATE_WAITING_SECURITY 1
#define MMOV_STATE_HOMING           3
#define MMOV_STATE_MANUAL           4
#define MMOV_STATE_AUTOMATIC        5
#define MMOV_STATE_ERROR            6

// Auto states
#define MMOV_AUTO_STATE_WAITING4PLAN 0
#define MMOV_AUTO_STATE_READY       1
#define MMOV_AUTO_STATE_2GOAL      2
#define MMOV_AUTO_STATE_STRETCHING 3
#define MMOV_AUTO_STATE_2FIRST_POS 4
#define MMOV_AUTO_STATE_REST      5
#define MMOV_AUTO_STATE_STOP 6

// Homing states
#define MMOV_VERIF_PERSON_IN     0
#define MMOV_HOMING_EXTENSION    1
#define MMOV_HOMING_EVERSION     2
#define MMOV_HOMING_DORSIFLEXION 3
#define MMOV_REST_POS            4

// Mouvement types
#define MMOV_DORSIFLEXION 1
#define MMOV_EVERSION     2
#define MMOV_EXTENSION    3

typedef struct
{
    uint8_t autoState;
    uint8_t homingState;
    uint8_t exCount;
    uint8_t repsCount;

} autoPlanInfo_t;

void ManagerMovement_Init();
void ManagerMovement_Reset();
void ManagerMovement_Task();

// Utilities
uint8_t         ManagerMovement_GetState();
void            ManagerMovement_SetState(uint8_t state);
autoPlanInfo_t* ManagerMovement_GetPlanData();

// Auto Setup
void ManagerMovement_AddExercise(uint8_t exerciseIdx, uint8_t exerciseType,
                                 uint8_t reps, float eTime, float pTime);
void ManagerMovement_SetFinalPos(uint8_t exerciseIdx, float finalPosition);
bool ManagerMovement_ResetExercise();

// Auto buttons
void ManagerMovement_StartExercise();
void ManagerMovement_PauseExercise();
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
