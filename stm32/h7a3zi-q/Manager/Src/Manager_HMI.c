#include <Manager_Error.h>
#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <Periph_UartRingBuf.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "cJSON.h"

#define SECTION_LENGTH                       20
#define SECTION_NBR                          150
#define M_HMI_TIMER                          50
#define M_HMI_STRING_LENGTH                  20
#define M_HMI_MODE_SECTION                   0
#define M_HMI_ACTION_SECTION                 1
#define M_HMI_CONTENT_SECTION                2
#define M_HMI_EXERCISE_SECTION_NBR           14
#define M_HMI_CONTENT_FIRST_EXERCISE_SECTION 12
#define M_HMI_LIMIT_SECTION_LENGHT			 12
#define MVT_MAX                              3

#define PI 3.1415926535

static const Motor* motorsData[MMOT_MOTOR_NBR];
static uint32_t     timerMs = 0;
char                ParsedMsg[SECTION_NBR][SECTION_LENGTH];
char                buf[PUART_RX_BUF_SIZE];

void ManagerHMI_ReceiveJSON();
void ManagerHMI_SendJSON();
void ManagerHMI_SetMotorDataToString();
void ManagerHMI_ParseJson(char* msg, uint8_t maxlength, uint8_t* sectionNbr);
void ManagerHMI_ExecuteJson(uint8_t sectionNbr);
void ManagerHMI_ExecuteManualIncrement(char* cmd);
void ManagerHMI_ExecutePlanCmd(char* cmd, uint8_t size);
void ManagerHMI_ExecuteControlCmd(char* cmd);

void ManagerHMI_GetStrMode(uint8_t index, char* str);
void ManagerHMI_GetStrAutoState(uint8_t index, char* str);
void ManagerHMI_GetStrHomingState(uint8_t index, char* str);
void ManagerHMI_GetStrLegSide(uint8_t index, char* str);

/*
 * Utilities
 */
float ManagerHMI_Degrees2Radians(float degrees);
float ManagerHMI_Radians2Degrees(float radians);
float ManagerHMI_Sec2Millis(float seconds);

bool sendNow;

void ManagerHMI_Init()
{
    cJSON_InitHooks(NULL);
    PeriphUartRingBuf_Init();

    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motorsData[i] = ManagerMotor_GetMotorData(i);
    }

    for (uint16_t i = 0; i < PUART_RX_BUF_SIZE; i++)
    {
        buf[i] = 0;
    }

    sendNow = false;
}

void ManagerHMI_Task()
{
    ManagerHMI_ReceiveJSON();

    if (HAL_GetTick() - timerMs >= M_HMI_TIMER || sendNow)
    {
        ManagerHMI_SendJSON();

        timerMs = HAL_GetTick();
        sendNow = false;
    }
}

void ManagerHMI_SendJSON()
{
    autoPlanInfo_t* pPlan = ManagerMovement_GetPlanData();

    // Define static buffers to avoid dynamic memory allocations
    char jsonMessage[PUART_TX_BUF_SIZE];
    char strMode[M_HMI_STRING_LENGTH];
    char strAutoState[M_HMI_STRING_LENGTH];
    char strHomingState[M_HMI_STRING_LENGTH];
    char strLegSide[M_HMI_STRING_LENGTH];

    // Get the data for the JSON fields
    ManagerHMI_GetStrMode(ManagerMovement_GetState(), strMode);
    ManagerHMI_GetStrHomingState(pPlan->homingState, strHomingState);
    ManagerHMI_GetStrAutoState(pPlan->autoState, strAutoState);
    ManagerHMI_GetStrLegSide(pPlan->legSide, strLegSide);

    uint8_t exerciseIdx = pPlan->exCount;
    uint8_t repsCount   = pPlan->repsCount;

    float positions[MMOT_MOTOR_NBR];
    float torques[MMOT_MOTOR_NBR];
    float current[MMOT_MOTOR_NBR];

    // Convert motor data
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        positions[i] = ManagerHMI_Radians2Degrees(motorsData[i]->position);
        torques[i]   = motorsData[i]->torque;
        current[i]   = motorsData[i]->current;
    }

    // Manually build the JSON string using snprintf
    snprintf(jsonMessage, PUART_TX_BUF_SIZE,
             "{\"Mode\":\"%s\",\"AutoState\":\"%s\",\"HomingState\":\"%s\","
             "\"CurrentLegSide\":\"%s\","
             "\"Repetitions\":%d,\"ExerciseIdx\":%d,\"ErrorCode\":\"%lu\","
             "\"Positions\":[%.2f,%.2f,%.2f],"
             "\"Torques\":[%.2f,%.2f,%.2f],"
             "\"Current\":[%.2f,%.2f,%.2f]}",
             strMode, strAutoState, strHomingState, strLegSide, repsCount,
             exerciseIdx, ManagerError_GetErrorStatus(), -positions[0],
             positions[1], positions[2], -torques[0], torques[1], torques[2],
             current[0], current[1], current[2]);

    // Send JSON string over UART
    PeriphUartRingBuf_Send(jsonMessage, strlen(jsonMessage));
}

void ManagerHMI_ReceiveJSON()
{
    uint32_t size = 0;
    PeriphUartRingBuf_ReadJson(buf, &size);

    if (size > 0 && size < PUART_RX_BUF_SIZE)
    {
        uint8_t sectionNbr = 0;
        ManagerHMI_ParseJson(buf, size, &sectionNbr);
        ManagerHMI_ExecuteJson(sectionNbr);
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
    if (sectionNbr >= 1)
    {
        if (strcmp(ParsedMsg[M_HMI_MODE_SECTION], "Manual") == 0)
        {
            if (ManagerMovement_SetState(MMOV_STATE_MANUAL))
            {
                if (strcmp(ParsedMsg[M_HMI_ACTION_SECTION], "Increment") == 0)
                {
                    ManagerHMI_ExecuteManualIncrement(
                        ParsedMsg[M_HMI_CONTENT_SECTION]);
                }
            }
            else
            {
                // Flag error: State couldn't change
            }
        }
        else if (strcmp(ParsedMsg[M_HMI_MODE_SECTION], "Auto") == 0)
        {
            if (ManagerMovement_SetState(MMOV_STATE_AUTOMATIC))
            {
                if (strcmp(ParsedMsg[M_HMI_ACTION_SECTION], "Plan") == 0)
                {
                    ManagerHMI_ExecutePlanCmd(
                        ParsedMsg[M_HMI_CONTENT_SECTION],
                        sectionNbr - M_HMI_CONTENT_SECTION);
                }
                else if (strcmp(ParsedMsg[M_HMI_ACTION_SECTION], "Resetplan") ==
                         0)
                {
                    ManagerMovement_ResetExercise();
                }
                else if (strcmp(ParsedMsg[M_HMI_ACTION_SECTION], "Control") ==
                         0)
                {
                    ManagerHMI_ExecuteControlCmd(
                        ParsedMsg[M_HMI_CONTENT_SECTION]);
                }
            }
            else
            {
                // Flag error: State couldn't change
            }
        }
        else if (strcmp(ParsedMsg[M_HMI_MODE_SECTION], "Reset") == 0)
        {
            ManagerSecurity_Reset();
        }
        else if (strcmp(ParsedMsg[M_HMI_MODE_SECTION], "ChangeSide") == 0)
        {
            if (ManagerMovement_SetState(MMOV_STATE_CHANGESIDE))
            {
            }
            else
            {
                // Flag error: State couldn't change
            }
        }
    }
}

void ManagerHMI_ExecuteManualIncrement(char* cmd)
{
    if (cmd != NULL)
    {
        if (strcmp(cmd, "EversionR") == 0)
        {
            ManagerMovement_ManualCmdEversion(MMOV_OUTSIDE);
        }
        else if (strcmp(cmd, "EversionL") == 0)
        {
            ManagerMovement_ManualCmdEversion(MMOV_INSIDE);
        }
        else if (strcmp(cmd, "DorsiflexionU") == 0)
        {
            ManagerMovement_ManualCmdDorsiflexion(MMOV_UP);
        }
        else if (strcmp(cmd, "DorsiflexionD") == 0)
        {
            ManagerMovement_ManualCmdDorsiflexion(MMOV_DOWN);
        }
        else if (strcmp(cmd, "ExtensionU") == 0)
        {
            ManagerMovement_ManualCmdExtension(MMOV_UP_EXT);
        }
        else if (strcmp(cmd, "ExtensionD") == 0)
        {
            ManagerMovement_ManualCmdExtension(MMOV_DOWN_EXT);
        }
    }
}

void ManagerHMI_ExecutePlanCmd(char* cmd, uint8_t size)
{
    if (true /*ManagerMovement_ResetExercise()*/)
    {
        // Verif if prefix of plan is present
        if (size > M_HMI_CONTENT_FIRST_EXERCISE_SECTION)
        {
            // Get max torque and pos (skip for now)
        	for (uint8_t i = 0; i < 2*MAX_MOVEMENT; i++)
        	{
        		float posLimit = atof(cmd);
				cmd += M_HMI_STRING_LENGTH;

				float torqueLimit = atof(cmd);
				cmd += M_HMI_STRING_LENGTH;

        		if (i < MAX_MOVEMENT-1)//Left leg limit
        		{
        			ManagerMovement_AddLimits(i, ManagerHMI_Degrees2Radians(posLimit), torqueLimit, MMOV_LEG_IS_LEFT);
        		}
        		else //Right leg limits
        		{
        			ManagerMovement_AddLimits(i-MAX_MOVEMENT, ManagerHMI_Degrees2Radians(posLimit), torqueLimit, MMOV_LEG_IS_RIGHT);
        		}
        	}
            //cmd += M_HMI_CONTENT_FIRST_EXERCISE_SECTION * M_HMI_STRING_LENGTH;
            size -= M_HMI_CONTENT_FIRST_EXERCISE_SECTION;

            // Verif if exercise plan is ok
            if (size % M_HMI_EXERCISE_SECTION_NBR == 0)
            {
                uint8_t exNbr = size / M_HMI_EXERCISE_SECTION_NBR;

                uint8_t mvtIdx = 0;

                // Get exercise data
                for (uint8_t i = 0; i < exNbr; i++)
                {
                    uint8_t movements;
                    uint8_t mvtNbr = atoi(cmd);
                    cmd += M_HMI_STRING_LENGTH;

                    for (uint8_t j = 0; j < mvtNbr; j++)
                    {
                        char* strMvt = cmd;
                        cmd += M_HMI_STRING_LENGTH;

                        float pos = atof(cmd);
                        cmd += M_HMI_STRING_LENGTH;

                        float torque = atof(cmd);
                        cmd += M_HMI_STRING_LENGTH;

                        if (strcmp(strMvt, "Dorsiflexion") == 0)
                        {
                            movements = MMOV_DORSIFLEXION;
                        }
                        else if (strcmp(strMvt, "Eversion") == 0)
                        {
                            movements = MMOV_EVERSION;
                        }
                        else if (strcmp(strMvt, "Extension") == 0)
                        {
                            movements = MMOV_EXTENSION;
                        }

                        ManagerMovement_AddMouvement(
                            mvtIdx, movements, ManagerHMI_Degrees2Radians(pos), torque);
                        mvtIdx++;

                        if (j == mvtNbr - 1)
                        {
                            cmd +=
                                M_HMI_STRING_LENGTH * (3 * (MVT_MAX - mvtNbr));
                        }
                    }

                    uint8_t rep = atoi(cmd);
                    cmd += M_HMI_STRING_LENGTH;

                    float rest = atof(cmd);
                    cmd += M_HMI_STRING_LENGTH;

                    float time = atof(cmd);
                    cmd += M_HMI_STRING_LENGTH;

                    float speed = atof(cmd);
                    cmd += M_HMI_STRING_LENGTH;

                    ManagerMovement_AddExerciseInfo(
                        i, mvtNbr, rep, ManagerHMI_Sec2Millis(time),
                        ManagerHMI_Sec2Millis(rest));
                }
            }
        }
    }
}

void ManagerHMI_ExecuteControlCmd(char* cmd)
{
    if (strcmp(ParsedMsg[2], "Start") == 0)
    {
        ManagerMovement_StartExercise();
    }
    else if (strcmp(ParsedMsg[2], "Pause") == 0)
    {
        ManagerMovement_PauseExercise();
    }
    else if (strcmp(ParsedMsg[2], "Stop") == 0)
    {
        ManagerMovement_StopExercise();
    }
}

void ManagerHMI_GetStrMode(uint8_t index, char* str)
{
    switch (index)
    {
    case MMOV_STATE_WAITING_SECURITY:
        strcpy(str, "WaitingSecurity");
        break;
    case MMOV_STATE_HOMING:
        strcpy(str, "Homing");
        break;
    case MMOV_STATE_MANUAL:
        strcpy(str, "Manual");
        break;
    case MMOV_STATE_AUTOMATIC:
        strcpy(str, "Automatic");
        break;
    case MMOV_STATE_CHANGESIDE:
        strcpy(str, "ChangeSide");
        break;
    case MMOV_STATE_ERROR:
        strcpy(str, "Error");
        break;

    default:
        strcpy(str, "");
        break;
    }
}

void ManagerHMI_GetStrAutoState(uint8_t index, char* str)
{
    switch (index)
    {
    case MMOV_AUTO_STATE_WAITING4PLAN:
        strcpy(str, "WaitingForPlan");
        break;
    case MMOV_AUTO_STATE_READY:
        strcpy(str, "Ready");
        break;
    case MMOV_AUTO_STATE_2GOAL:
        strcpy(str, "ToGoal");  // mettre plus de detail etre plus clair
        break;
    case MMOV_AUTO_STATE_STRETCHING:
        strcpy(str, "Stretching");
        break;
    case MMOV_AUTO_STATE_2FIRST_POS:  // mettre plus de detail etre plus clair
        strcpy(str, "ToFirstPos");
        break;
    case MMOV_AUTO_STATE_REST:
        strcpy(str, "Resting");
        break;
    case MMOV_AUTO_STATE_STOP:
        strcpy(str, "Stop");
        break;
    default:
        strcpy(str, "");
        break;
    }
}

void ManagerHMI_GetStrHomingState(uint8_t index, char* str)
{
    switch (index)
    {
    case MMOV_VERIF_PERSON_IN:
        strcpy(str, "VerifIfUser");
        break;
    case MMOV_HOMING_EXTENSION:
        strcpy(str, "Extension");
        break;
    case MMOV_HOMING_EVERSION:
        strcpy(str, "Eversion");
        break;
    case MMOV_HOMING_DORSIFLEXION:
        strcpy(str, "Dorsiflexion");
        break;
    case MMOV_HOMING_REST_POS:
        strcpy(str, "Rest");
        break;
    default:
        strcpy(str, "");
        break;
    }
}

void ManagerHMI_GetStrLegSide(uint8_t index, char* str)
{
    switch (index)
    {
    case MMOV_LEG_IS_LEFT:
        strcpy(str, "LegIsLeft");
        break;
    case MMOV_LEG_IS_RIGHT:
        strcpy(str, "LegIsRight");
        break;
    default:
        strcpy(str, "");
        break;
    }
}

float ManagerHMI_Radians2Degrees(float radians)
{
    return radians * (180.0 / PI);
}

float ManagerHMI_Degrees2Radians(float degrees)
{
    return degrees * (PI / 180.0);
}

float ManagerHMI_Sec2Millis(float seconds)
{
    return seconds *= 1000;
}

void ManagerHMI_SendNow()
{
    sendNow = true;
}
