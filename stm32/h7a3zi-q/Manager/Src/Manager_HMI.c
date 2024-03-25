#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"
#include "comUtils_UART2.h"
#include "uartRingBufDMA.h"

#define M_HMI_TIMER 100

typedef struct
{
    char pos[M_HMI_STR_LENGTH];
    char vel[M_HMI_STR_LENGTH];
    char tor[M_HMI_STR_LENGTH];
} MotorDataString_t;

typedef struct
{
    MotorDataString_t strMotors[MOTOR_NBR];
} managerHMI_t;

managerHMI_t managerHMI;

static const Motor* motorsData[MOTOR_NBR];
static uint32_t     timerMs = 0;

void ManagerHMI_ReceiveJSON();
void ManagerHMI_SendJSON();
void ManagerHMI_SetMotorDataToString();

void ManagerHMI_Init()
{
    cJSON_InitHooks(NULL);
    Ringbuf_Init();

    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        motorsData[i] = ManagerMotor_GetMotorData(i);
    }
}

void ManagerHMI_Task()
{
    ManagerHMI_ReceiveJSON();

    if (HAL_GetTick() - timerMs >= M_HMI_TIMER)
    {
        ManagerHMI_SendJSON();

        timerMs = HAL_GetTick();
    }
}

void ManagerHMI_SendJSON()
{
    cJSON* root = cJSON_CreateObject();
    // Add strings to the JSON object

    ManagerHMI_SetMotorDataToString();

    char key[M_HMI_STR_LENGTH];
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        sprintf(key, "Motor%dPos", i + 1);
        cJSON_AddStringToObject(root, key, managerHMI.strMotors[i].pos);
        sprintf(key, "Motor%dVel", i + 1);
        cJSON_AddStringToObject(root, key, managerHMI.strMotors[i].vel);
        sprintf(key, "Motor%dTor", i + 1);
        cJSON_AddStringToObject(root, key, managerHMI.strMotors[i].tor);
    }

    // Print the JSON object
    char* jsonMessage = cJSON_PrintUnformatted(root);

    // Send JSON string over UART
    HAL_UART_Transmit(&huart3, (uint8_t*) jsonMessage, strlen(jsonMessage),
                      HAL_MAX_DELAY);

    free(jsonMessage);
    cJSON_Delete(root);
}

void ManagerHMI_ReceiveJSON()
{
    char* cmd;
    cmd = searchWord((char*) MainBuf_UART);

    if (cmd != NULL)
    {
        if (strcmp(cmd, "eversionR") == 0)
        {
            ManagerMovement_ManualCmdEversion(MOV_RIGTH);
        }
        else if (strcmp(cmd, "eversionL") == 0)
        {
            ManagerMovement_ManualCmdEversion(MOV_LEFT);
        }
        else if (strcmp(cmd, "dorsiflexionU") == 0)
        {
            ManagerMovement_ManualCmdDorsiflexion(MOV_UP);
        }
        else if (strcmp(cmd, "dorsiflexionD") == 0)
        {
            ManagerMovement_ManualCmdDorsiflexion(MOV_DOWN);
        }
        else if (strcmp(cmd, "extensionU") == 0)
        {
            ManagerMovement_ManualCmdExtension(MOV_UP);
        }
        else if (strcmp(cmd, "extensionD") == 0)
        {
            ManagerMovement_ManualCmdExtension(MOV_DOWN);
        }
        else if (strcmp(cmd, "goHome1") == 0)
        {
            ManagerMovement_ManualCmdHome(MOTOR_1);
        }
        else if (strcmp(cmd, "goHome2") == 0)
        {
            ManagerMovement_ManualCmdHome(MOTOR_2);
        }
        else if (strcmp(cmd, "goHome3") == 0)
        {
            ManagerMovement_ManualCmdHome(MOTOR_3);
        }
        else if (strcmp(cmd, "goHome") == 0)
        {
            ManagerMovement_ManualCmdHomeAll();
        }
    }
}

void ManagerHMI_SetMotorDataToString()
{
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        sprintf(managerHMI.strMotors[i].pos, "%.2f", motorsData[i]->position);
        sprintf(managerHMI.strMotors[i].vel, "%.2f", motorsData[i]->velocity);
        sprintf(managerHMI.strMotors[i].tor, "%.2f", motorsData[i]->torque);
    }
}
