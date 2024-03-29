#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <Periph_UartRingBuf.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"

#define SECTION_LENGTH 20
#define SECTION_NBR    30
#define BUF_LENGTH     50
#define M_HMI_TIMER    50

typedef struct
{
    char pos[M_HMI_STR_LENGTH];
    char vel[M_HMI_STR_LENGTH];
    char tor[M_HMI_STR_LENGTH];
} MotorDataString_t;

typedef struct
{
    MotorDataString_t strMotors[MMOT_MOTOR_NBR];
} managerHMI_t;

managerHMI_t managerHMI;

static const Motor* motorsData[MMOT_MOTOR_NBR];
static uint32_t     timerMs = 0;
char                ParsedMsg[SECTION_NBR][SECTION_LENGTH];
char                buf[BUF_LENGTH];

void ManagerHMI_ReceiveJSON();
void ManagerHMI_SendJSON();
void ManagerHMI_SetMotorDataToString();
void ManagerHMI_ParseJson(char* msg, uint8_t maxlength, uint8_t* sectionNbr);
void ManagerHMI_ExecuteJson(uint8_t sectionNbr);
void ManagerHMI_ExecuteManualIncrement(char* cmd);
void ManagerHMI_ExecuteManualHoming(char* cmd);

void ManagerHMI_Init()
{
    cJSON_InitHooks(NULL);
    PeriphUartRingBuf_Init();

    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motorsData[i] = ManagerMotor_GetMotorData(i);
    }

    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < BUF_LENGTH; i++)
    {
        buf[i] = 0;
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
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
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
    PeriphUartRingBuf_Send(jsonMessage, strlen(jsonMessage));

    free(jsonMessage);
    cJSON_Delete(root);
}

void ManagerHMI_ReceiveJSON()
{
    uint32_t size = 0;
    PeriphUartRingBuf_ReadJson(buf, &size);

    if (size > 0 && size < BUF_LENGTH)
    {
        uint8_t sectionNbr = 0;
        ManagerHMI_ParseJson(buf, size, &sectionNbr);
        ManagerHMI_ExecuteJson(sectionNbr);
    }
}

void ManagerHMI_SetMotorDataToString()
{
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        sprintf(managerHMI.strMotors[i].pos, "%.2f", motorsData[i]->position);
        sprintf(managerHMI.strMotors[i].vel, "%.2f", motorsData[i]->velocity);
        sprintf(managerHMI.strMotors[i].tor, "%.2f", motorsData[i]->torque);
    }
}

void ManagerHMI_ParseJson(char* msg, uint8_t maxlength, uint8_t* sectionNbr)
{
    // Reset ParsedMsg array
    memset(ParsedMsg, 0, sizeof(ParsedMsg));

    // Check if the message starts with '{' and ends with '}'
    if (msg[0] != '{' || msg[maxlength - 1] != '}')
    {
        // Invalid message format
        return;
    }

    // Parse number of sections
    uint8_t sectionCount = 0;
    char*   ptr          = strtok(msg + 1, ";");  // Skip the '{'
    while (ptr != NULL && sectionCount < SECTION_NBR)
    {
        if (*ptr != '}')  // Ignore '}' as a section
        {
            strncpy(ParsedMsg[sectionCount], ptr, SECTION_LENGTH - 1);
            ParsedMsg[sectionCount][SECTION_LENGTH - 1] =
                '\0';  // Ensure null-terminated
            sectionCount++;
            ptr = strtok(NULL, ";");
        }
        else
        {
            break;
        }
    }

    *sectionNbr = sectionCount;

    // Check if the number of sections exceeds the maximum allowed
    if (sectionCount >= SECTION_NBR)
    {
        // Too many sections, truncate
        *sectionNbr = 0;
        return;
    }
}

void ManagerHMI_ExecuteJson(uint8_t sectionNbr)
{
    if (sectionNbr >= 3)
    {
        if (strcmp(ParsedMsg[0], "Manual") == 0)
        {
            if (strcmp(ParsedMsg[1], "Increment") == 0)
            {
                ManagerHMI_ExecuteManualIncrement(ParsedMsg[2]);
            }
        }
        else if (strcmp(ParsedMsg[0], "Auto") == 0)
        {
        }
    }
}

void ManagerHMI_ExecuteManualIncrement(char* cmd)
{
    if (cmd != NULL)
    {
        if (strcmp(cmd, "eversionR") == 0)
        {
            ManagerMovement_ManualCmdEversion(MMOV_RIGTH);
        }
        else if (strcmp(cmd, "eversionL") == 0)
        {
            ManagerMovement_ManualCmdEversion(MMOV_LEFT);
        }
        else if (strcmp(cmd, "dorsiflexionU") == 0)
        {
            ManagerMovement_ManualCmdDorsiflexion(MMOV_UP);
        }
        else if (strcmp(cmd, "dorsiflexionD") == 0)
        {
            ManagerMovement_ManualCmdDorsiflexion(MMOV_DOWN);
        }
        else if (strcmp(cmd, "extensionU") == 0)
        {
            ManagerMovement_ManualCmdExtension(MMOV_UP);
        }
        else if (strcmp(cmd, "extensionD") == 0)
        {
            ManagerMovement_ManualCmdExtension(MMOV_DOWN);
        }
        else if (strcmp(cmd, "goHome1") == 0)
        {
            ManagerMovement_ManualCmdHome(MMOT_MOTOR_1);
        }
        else if (strcmp(cmd, "goHome2") == 0)
        {
            ManagerMovement_ManualCmdHome(MMOT_MOTOR_2);
        }
        else if (strcmp(cmd, "goHome3") == 0)
        {
            ManagerMovement_ManualCmdHome(MMOT_MOTOR_3);
        }
        else if (strcmp(cmd, "goHome") == 0)
        {
            ManagerMovement_ManualCmdHomeAll();
        }
    }
}

void ManagerHMI_ExecuteManualHoming(char* cmd)
{
    if (cmd != NULL)
    {
        if (strcmp(cmd, "goHome1") == 0)
        {
            ManagerMovement_ManualCmdHome(MMOT_MOTOR_1);
        }
        else if (strcmp(cmd, "goHome2") == 0)
        {
            ManagerMovement_ManualCmdHome(MMOT_MOTOR_2);
        }
        else if (strcmp(cmd, "goHome3") == 0)
        {
            ManagerMovement_ManualCmdHome(MMOT_MOTOR_3);
        }
        else if (strcmp(cmd, "goHome") == 0)
        {
            ManagerMovement_ManualCmdHomeAll();
        }
    }
}
