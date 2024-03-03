#include <Manager_Motor_HMI.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>


#include "cJSON.h"
#include "comUtils_UART2.h"
#include "uartRingBufDMA.h"

#define MOTOR_NBR 3
#define MOTOR_1   0
#define MOTOR_2   1
#define MOTOR_3   2

#define MOTOR_1_CAN_ID 1
#define MOTOR_2_CAN_ID 2
#define MOTOR_3_CAN_ID 3

// States
#define CAN_VERIF  0
#define SET_ORIGIN 1
#define READY2MOVE 2
#define ERROR      3

// Error Codes
#define SET_ORIGINES_MOTORS_ERROR   -1
#define CAN_CONNECTION_MOTORS_ERROR -2

#define MOTOR_STEP 1

#define TIMER 5
#define MAX_TRY                                                                \
    50  // Correspond a 5 secondes d attente avant de faire une erreur

typedef struct
{
	uint8_t state;
	float kp;
	float kd;
	int8_t  errorCode;

}managerMotor_t;

uint8_t  tryCount = 0;
uint32_t timerMs  = 0;

MotorInfo motors[MOTOR_NBR];
uint8_t     motorIndexes[MOTOR_NBR];

managerMotor_t managerMotor;

uint8_t data[8];

// Prototypes
void    ManagerMotorHMI_ReceiveFromMotors();
void    ManagerMotorHMI_CalculateNextPositions();
void    ManagerMotorHMI_SendToMotors();
void    ManagerMotorHMI_SendToHMI();
void    ManagerMotorHMI_SetOrigines();
void    ManagerMotorHMI_CANVerif();
void 	ManagerMotorHMI_enableMotors();

void ManagerMotorHMI_Init()
{
    // InitCanBus
    PeriphCanbus_Init();
    PeriphMotors_Init(PeriphCanbus_TransmitDLC8);
    HAL_Delay(50);

    // Init Struct motors
    PeriphMotors_InitMotor(&motors[MOTOR_1].motor, MOTOR_1_CAN_ID, MOTOR_AK10_9);
	PeriphMotors_InitMotor(&motors[MOTOR_2].motor, MOTOR_2_CAN_ID, MOTOR_AK10_9);
	PeriphMotors_InitMotor(&motors[MOTOR_3].motor, MOTOR_3_CAN_ID, MOTOR_AK80_64);
	HAL_Delay(50);
	PeriphMotors_Enable(&motors[MOTOR_1].motor);
	PeriphMotors_Enable(&motors[MOTOR_2].motor);
	PeriphMotors_Enable(&motors[MOTOR_3].motor);

    for (uint8_t i = 0; i < MOTOR_NBR; i++)
	{
		motors[i].nextPosition = 0;
		motors[i].temp         = 0;
		motors[i].error        = 0;
		motors[i].detected     = false;
	}

    for (uint8_t i = 0; i < 8; i++)
    {
    	data[i] = 0;
    }

    managerMotor.kp = 3.0f;
    managerMotor.kd = 2.0f;

    // Init State machine
    managerMotor.state = CAN_VERIF;
}

void ManagerMotorHMI_Task()
{
    // Read les moteurs avant chacune des etapes
     // Ajouter gestion erreur si moteurs
                                          // renvoi rien
    // Machine à état qui prend en compte l'initialisation des moteurs, première
    // lecture et envoie des commandes aux moteurs
    if (HAL_GetTick() - timerMs >= TIMER)
    {
    	ManagerMotorHMI_ReceiveFromMotors();
        switch (managerMotor.state)
        {
        case CAN_VERIF:
            ManagerMotorHMI_CANVerif();
            break;

        case SET_ORIGIN:
            ManagerMotorHMI_SetOrigines();
            break;

        case READY2MOVE:
            ManagerMotorHMI_CalculateNextPositions();  // Devient un manager a
                                                       // part entiere
            ManagerMotorHMI_SendToMotors();
            //ManagerMotorHMI_SendToHMI();
            break;

        case ERROR:
            // Send la valeur de l'erreur au HMI?
            break;
        }
        timerMs = HAL_GetTick();
    }
}

void ManagerMotorHMI_ReceiveFromMotors()
{
	;
	if (PeriphCanbus_GetNodeMsg(motors[MOTOR_1].motor.id, data)/*&& data[0] != '\0'*/)
	{
		PeriphMotors_ParseMotorState(&motors[MOTOR_1].motor, data);
		motors[MOTOR_1].detected = true;
	}

	if (PeriphCanbus_GetNodeMsg(motors[MOTOR_2].motor.id, data) /*&& data[0] != '\0'*/)
	{
		PeriphMotors_ParseMotorState(&motors[MOTOR_2].motor, data);
		motors[MOTOR_2].detected = true;
	}


	if (PeriphCanbus_GetNodeMsg(motors[MOTOR_3].motor.id, data) /*&& data[0] != '\0'*/)
	{
		PeriphMotors_ParseMotorState(&motors[MOTOR_3].motor, data);
		motors[MOTOR_3].detected = true;
	}
}

void ManagerMotorHMI_CalculateNextPositions()
{
    char* foundWord = searchWord((char*) MainBuf_UART);

    if (strcmp(foundWord, "eversionR") == 0)
    {
        motors[MOTOR_1].nextPosition -= MOTOR_STEP;
        motors[MOTOR_2].nextPosition += MOTOR_STEP;
    }
    else if (strcmp(foundWord, "eversionL") == 0)
    {
        motors[MOTOR_1].nextPosition += MOTOR_STEP;
        motors[MOTOR_2].nextPosition -= MOTOR_STEP;
    }
    else if (strcmp(foundWord, "dorsiflexionU") == 0)
    {
        motors[MOTOR_1].nextPosition += MOTOR_STEP;
        motors[MOTOR_2].nextPosition += MOTOR_STEP;
    }
    else if (strcmp(foundWord, "dorsiflexionD") == 0)
    {
        motors[MOTOR_1].nextPosition -= MOTOR_STEP;
        motors[MOTOR_2].nextPosition -= MOTOR_STEP;
    }
    else if (strcmp(foundWord, "extensionU") == 0)
    {
        motors[MOTOR_3].nextPosition += MOTOR_STEP;
    }
    else if (strcmp(foundWord, "extensionD") == 0)
    {
        motors[MOTOR_3].nextPosition -= MOTOR_STEP;
    }
    else if (strcmp(foundWord, "goHome1") == 0)
    {
        motors[MOTOR_1].nextPosition = 0;
    }
    else if (strcmp(foundWord, "goHome2") == 0)
    {
        motors[MOTOR_2].nextPosition = 0;
    }
    else if (strcmp(foundWord, "goHome3") == 0)
    {
        motors[MOTOR_3].nextPosition = 0;
    }
    else if (strcmp(foundWord, "setHome") == 0)
    {
        motors[MOTOR_1].nextPosition = 0;
        motors[MOTOR_2].nextPosition = 0;
        motors[MOTOR_3].nextPosition = 0;
    }
    else if (strcmp(foundWord, "goHome") == 0)
    {
        motors[MOTOR_1].nextPosition = 0;
        motors[MOTOR_2].nextPosition = 0;
        motors[MOTOR_3].nextPosition = 0;
    }
}

void ManagerMotorHMI_SendToMotors()
{
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
    	PeriphMotors_Move(&motors[i].motor, motors[i].nextPosition, 0, 0, managerMotor.kp, managerMotor.kd);
    }
}

void ManagerMotorHMI_SendToHMI()
{
    cJSON* root = cJSON_CreateObject();

    // Convert numbers to strings using sprintf
    char eversionStr[15];
    char dorsiflexionStr[15];
    char extensionStr[15];
    sprintf(eversionStr, "%.2f", motors[MOTOR_1].motor.position);
    sprintf(dorsiflexionStr, "%.2f", motors[MOTOR_2].motor.position);
    sprintf(extensionStr, "%.2f", motors[MOTOR_3].motor.position);

    // Add strings to the JSON object
    cJSON_AddStringToObject(root, "dorsiflexion", dorsiflexionStr);
    cJSON_AddStringToObject(root, "eversion", eversionStr);
    cJSON_AddStringToObject(root, "extension", extensionStr);

    // Print the JSON object
    char* jsonMessage = cJSON_PrintUnformatted(root);

    // Send JSON string over UART
    HAL_UART_Transmit(&huart3, (uint8_t*) jsonMessage, strlen(jsonMessage),
                      HAL_MAX_DELAY);

    free(jsonMessage);
    cJSON_Delete(root);  // Correct way to free cJSON memory
}

void ManagerMotorHMI_SetOrigines()
{
    if (motors[MOTOR_1].motor.position == 0.0 && motors[MOTOR_2].motor.position == 0.0 &&
    		motors[MOTOR_3].motor.position == 0.0)
    {
    	managerMotor.state = READY2MOVE;
        tryCount   = 0;
    }
    else if (tryCount < MAX_TRY)
    {
    	PeriphMotors_SetZeroPosition(&motors[MOTOR_1].motor);
		PeriphMotors_SetZeroPosition(&motors[MOTOR_2].motor);
		PeriphMotors_SetZeroPosition(&motors[MOTOR_3].motor);

        //tryCount += 1;
    }
    else
    {
    	managerMotor.state = ERROR;
    	managerMotor.errorCode  = SET_ORIGINES_MOTORS_ERROR;
    }
}

void ManagerMotorHMI_CANVerif()
{
    if (motors[MOTOR_1].detected && motors[MOTOR_2].detected &&
        motors[MOTOR_3].detected)
    {
    	managerMotor.state = SET_ORIGIN;
        tryCount   = 0;
    }
    else if (tryCount < MAX_TRY)
    {
    	ManagerMotorHMI_enableMotors();

        //tryCount += 1;
    }
    else
    {
    	managerMotor.state = ERROR;
    	managerMotor.errorCode = CAN_CONNECTION_MOTORS_ERROR;
    }
}

void ManagerMotorHMI_enableMotors()
{
	PeriphMotors_Move(&motors[MOTOR_1].motor, 0, 0, 0, 0, 0);
	PeriphMotors_Move(&motors[MOTOR_2].motor, 0, 0, 0, 0, 0);
	PeriphMotors_Move(&motors[MOTOR_3].motor, 0, 0, 0, 0, 0);
}
