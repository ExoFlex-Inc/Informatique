#ifndef MANAGER_MOTOR_HMI_H
#define MANAGER_MOTOR_HMI_H

#include "main.h"

// States
#define MOTOR_STATE 0
#define SET_ORIGIN 1
#define READY2MOVE 2
#define ERROR 3

typedef struct{
	uint8_t index;
    float position;
    float speed;
    float current;
    uint8_t temp;
    uint8_t error;
    float nextPosition;
    bool update;
}motorInfo_t;

void ManagerMotorHMI_Init();
void ManagerMotorHMI_Task();

#endif
