#ifndef MANAGER_MOVEMENT_H
#define MANAGER_MOVEMENT_H

#include "main.h"

/***********************************************/
// DISABLE TORQUE STRETCHING
// #define MMOV_DISABLE_TORQUE_STRETCHING
/***********************************************/

#define MMOV_INSIDE   1
#define MMOV_OUTSIDE  -1
#define MMOV_UP       1
#define MMOV_DOWN     -1
#define MMOV_UP_EXT   -1
#define MMOV_DOWN_EXT 1

#define MMOV_LEG_IS_LEFT  1
#define MMOV_LEG_IS_RIGHT 2

// States
#define MMOV_STATE_WAITING_SECURITY 1
#define MMOV_STATE_HOMING           3
#define MMOV_STATE_MANUAL           4
#define MMOV_STATE_CHANGESIDE       7
#define MMOV_STATE_AUTOMATIC        5
#define MMOV_STATE_ERROR            6

// Auto states
#define MMOV_AUTO_STATE_WAITING4PLAN 0
#define MMOV_AUTO_STATE_READY        1
#define MMOV_AUTO_STATE_2GOAL        2
#define MMOV_AUTO_STATE_STRETCHING   3
#define MMOV_AUTO_STATE_2FIRST_POS   4
#define MMOV_AUTO_STATE_REST         5
#define MMOV_AUTO_STATE_STOP         6

// Homing states
#define MMOV_VERIF_PERSON_IN     0
#define MMOV_HOMING_EXTENSION    1
#define MMOV_HOMING_EVERSION     2
#define MMOV_HOMING_DORSIFLEXION 3
#define MMOV_HOMING_REST_POS     4

// Mouvement types
#define MMOV_DORSIFLEXION 1
#define MMOV_EVERSION     2
#define MMOV_EXTENSION    3

#define MAX_MOVEMENT 3

#define MMOV_MOVESTATE_EVERSION     0
#define MMOV_MOVESTATE_DORSIFLEXION 1
#define MMOV_MOVESTATE_EXTENSION    2

typedef struct
{
    uint8_t autoState;
    uint8_t homingState;
    uint8_t exCount;
    uint8_t repsCount;
    uint8_t legSide;

} autoPlanInfo_t;

void ManagerMovement_Init();
void ManagerMovement_Reset();
void ManagerMovement_Task();

// Utilities
uint8_t         ManagerMovement_GetState();
autoPlanInfo_t* ManagerMovement_GetPlanData();
bool            ManagerMovement_SetState(uint8_t newState);

// Auto Setup
void ManagerMovement_AddExerciseInfo(uint8_t exerciseIdx, uint8_t moveNbr,
                                     uint8_t reps, float eTime, float pTime);
void ManagerMovement_AddLimits(uint8_t Idx, float maxPos, float maxTorque,
                               uint8_t side);
void ManagerMovement_AddMouvement(uint8_t mvtIdx, uint8_t movementType,
                                  float finalPosition, float targetTorque);
void ManagerMovement_ResetExercise();

// Auto buttons
void ManagerMovement_StartExercise();
void ManagerMovement_PauseExercise();
void ManagerMovement_StopExercise();

// Movement commands
void ManagerMovement_ManualCmdEversion(int8_t direction);
void ManagerMovement_ManualCmdDorsiflexion(int8_t direction);
void ManagerMovement_ManualCmdExtension(int8_t direction);

bool ManagerMovement_IsWaitingSecurity();
void ManagerMovement_SecurityPassed();
void ManagerMovement_SetError();
bool ManagerMovement_InError();

uint8_t ManagerMovement_GetState();

#endif
