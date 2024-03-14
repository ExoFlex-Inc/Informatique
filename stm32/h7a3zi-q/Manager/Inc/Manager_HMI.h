#ifndef MANAGER_HMI_H
#define MANAGER_HMI_H

#include "main.h"

#define STR_LENGTH 15

void ManagerHMI_Init();
void ManagerHMI_Task();

void ManagerHMI_ReceiveJSON(char* foundWord);
void ManagerHMI_SetMotorData(float posEv, float posD, float posEx);

#endif
