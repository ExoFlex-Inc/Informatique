#ifndef MANAGER_MOVEMENT_H
#define MANAGER_MOVEMENT_H

#include "main.h"

#define MOV_RIGTH 1
#define MOV_LEFT  -1
#define MOV_UP    1
#define MOV_DOWN  -1

void ManagerMovement_Init();
void ManagerMovement_Task();

//Utilities
uint8_t ManagerMovement_GetState();
void ManagerMovement_SetState(uint8_t state);

//Auto Setup
void ManagerMovement_ResetExercise();
void ManagerMovement_AddExercise(uint8_t exerciseIdx, uint8_t exerciseType, uint8_t reps, float time);

//Auto buttons
void ManagerMovement_StartExercise();
void ManagerMovement_StopExercise();
void ManagerMovement_NextExercise();


//Movement commands
void ManagerMovement_ManualCmdEversion(int8_t direction);
void ManagerMovement_ManualCmdDorsiflexion(int8_t direction);
void ManagerMovement_ManualCmdExtension(int8_t direction);
void ManagerMovement_ManualCmdHome(uint8_t motorIndex);
void ManagerMovement_ManualCmdHomeAll();

#endif
