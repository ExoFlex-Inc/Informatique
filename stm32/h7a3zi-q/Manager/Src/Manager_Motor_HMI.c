#include <Manager_Motor_HMI.h>
#include "CanMotorServo.h"

#include "cJSON.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "comUtils_UART2.h"
#include "uartRingBufDMA.h"

#define MOTOR_NBR 3
#define MOTOR_1 0
#define MOTOR_2 1
#define MOTOR_3 2

#define MOTOR_1_CAN_ID 4
#define MOTOR_2_CAN_ID 2
#define MOTOR_3_CAN_ID 3

// States
#define CAN_VERIF 0
#define SET_ORIGIN 1
#define READY2MOVE 2
#define ERROR 3

#define MOTOR_STEP 1

#define TRY 3
uint8_t tryCount = 0;

motorInfo_t motors[MOTOR_NBR];
uint8_t motorIndexes[MOTOR_NBR];

uint8_t motorState;

//Prototypes
void ManagerMotorHMI_ReceiveFromMotors();
void ManagerMotorHMI_CalculateNextPositions();
void ManagerMotorHMI_SendToMotors();
void ManagerMotorHMI_SendToHMI();
uint8_t ManagerMotorHMI_CANExtractControllerID(uint32_t ext_id);
void ManagerMotorHMI_SetOrigines();
void ManagerMotorHMI_CANVerif();

void ManagerMotorHMI_Init()
{
	CanMotorServo_Init();

	for (uint8_t i = 0; i < MOTOR_NBR; i++)
	{
		motors[i].index = i + 1;
		motors[i].position = 0;
		motors[i].nextPosition = 0;
		motors[i].speed = 0;
		motors[i].current = 0;
		motors[i].temp = 0;
		motors[i].error = 0;
		motors[i].update = false;
		motors[i].detected = false;
	}
	motorState = CAN_VERIF;
}

void ManagerMotorHMI_Task()
{
	// Read les moteurs avant chacune des etapes
	ManagerMotorHMI_ReceiveFromMotors(); //Ajouter gestion erreur si moteurs renvoi rien

	// Machine à état qui prend en compte l'initialisation des moteurs, première lecture et home
	switch(motorState)
	{
		case CAN_VERIF:
			ManagerMotorHMI_CANVerif();
			break;

		case SET_ORIGIN:
			ManagerMotorHMI_SetOrigines();
			break;

		case READY2MOVE:
			ManagerMotorHMI_SendToMotors();
			ManagerMotorHMI_CalculateNextPositions(); //Devient un manager a part entiere
			ManagerMotorHMI_SendToHMI();
			break;

		case ERROR:
			break;
	}
}

void ManagerMotorHMI_ReceiveFromMotors()
{
	uint8_t received_controller_id = ManagerMotorHMI_CANExtractControllerID(RxHeader.Identifier);

	if (received_controller_id == MOTOR_1_CAN_ID)
	{
		CanMotorServo_Receive(&motors[MOTOR_1].position, &motors[MOTOR_1].speed, &motors[MOTOR_1].current, &motors[MOTOR_1].temp, &motors[MOTOR_1].error);
		motors[MOTOR_1].detected = true;
	}
	else if (received_controller_id == MOTOR_2_CAN_ID)
	{
		CanMotorServo_Receive(&motors[MOTOR_2].position, &motors[MOTOR_2].speed, &motors[MOTOR_2].current, &motors[MOTOR_2].temp, &motors[MOTOR_2].error);
		motors[MOTOR_2].detected = true;
	}
	else if (received_controller_id == MOTOR_3_CAN_ID)
	{
		CanMotorServo_Receive(&motors[MOTOR_3].position, &motors[MOTOR_3].speed, &motors[MOTOR_3].current, &motors[MOTOR_3].temp, &motors[MOTOR_3].error);
		motors[MOTOR_3].detected = true;
	}
//	else
//	{
//		motorState = ERROR;
//	}
}


void ManagerMotorHMI_CalculateNextPositions()
{


  char* foundWord = searchWord((char*) MainBuf_UART);

  if (strcmp(foundWord, "eversionR") == 0) {
	  motors[MOTOR_1].nextPosition -= MOTOR_STEP;
	  motors[MOTOR_2].nextPosition += MOTOR_STEP;
	  motors[MOTOR_1].update = true;
	  motors[MOTOR_2].update = true;
  }
  else if (strcmp(foundWord, "eversionL") == 0) {
	  motors[MOTOR_1].nextPosition += MOTOR_STEP;
	  motors[MOTOR_2].nextPosition -= MOTOR_STEP;
	  motors[MOTOR_1].update = true;
	  motors[MOTOR_2].update = true;
  }
  else if (strcmp(foundWord, "dorsiflexionU") == 0) {
	  motors[MOTOR_1].nextPosition += MOTOR_STEP;
	  motors[MOTOR_2].nextPosition += MOTOR_STEP;
	  motors[MOTOR_1].update = true;
	  motors[MOTOR_2].update = true;
  }
  else if (strcmp(foundWord, "dorsiflexionD") == 0) {
	  motors[MOTOR_1].nextPosition -= MOTOR_STEP;
	  motors[MOTOR_2].nextPosition -= MOTOR_STEP;
	  motors[MOTOR_1].update = true;
	  motors[MOTOR_2].update = true;

  }
  else if (strcmp(foundWord, "extensionU") == 0) {
	  motors[MOTOR_3].nextPosition += MOTOR_STEP;
	  motors[MOTOR_3].update = true;

  }
  else if (strcmp(foundWord, "extensionD") == 0) {
	  motors[MOTOR_3].nextPosition -= MOTOR_STEP;
	  motors[MOTOR_3].update = true;

  }
  else if (strcmp(foundWord, "goHome1") == 0) {

	  motors[MOTOR_1].nextPosition = 0;
	  motors[MOTOR_1].update = true;

  }
  else if (strcmp(foundWord, "goHome2") == 0) {

	  motors[MOTOR_2].nextPosition = 0;
	  motors[MOTOR_2].update = true;

  }
  else if (strcmp(foundWord, "goHome3") == 0) {

	  motors[MOTOR_3].nextPosition = 0;
	  motors[MOTOR_3].update = true;

  }
  else if (strcmp(foundWord, "setHome") == 0) {

	CanMotorServo_SetOrigin(MOTOR_1_CAN_ID);
	CanMotorServo_SetOrigin(MOTOR_2_CAN_ID);
	CanMotorServo_SetOrigin(MOTOR_3_CAN_ID);
	motors[MOTOR_1].nextPosition = 0;
	motors[MOTOR_2].nextPosition = 0;
	motors[MOTOR_3].nextPosition = 0;
  }
  else if (strcmp(foundWord, "goHome") == 0) {
	  motors[MOTOR_1].nextPosition = 0;
	  motors[MOTOR_2].nextPosition = 0;
	  motors[MOTOR_3].nextPosition = 0;
	  motors[MOTOR_1].update = true;
	  motors[MOTOR_2].update = true;
	  motors[MOTOR_3].update = true;
  }
}

void ManagerMotorHMI_SendToMotors()
{
	for(uint8_t i = 0; i<MOTOR_NBR; i++)
	{
		if (motors[i].update)
		{
			CanMotorServo_SetPos(motors[i].index, motors[i].nextPosition);
			motors[i].update = false;
		}
	}
}

void ManagerMotorHMI_SendToHMI()
{
	cJSON *root = cJSON_CreateObject();

	// Convert numbers to strings using sprintf
	char eversionStr[15];
	char dorsiflexionStr[15];
	char extensionStr[15];
	sprintf(eversionStr, "%.2f", motors[MOTOR_1].position);
	sprintf(dorsiflexionStr, "%.2f", motors[MOTOR_2].position);
	sprintf(extensionStr, "%.2f", motors[MOTOR_3].position);

	// Add strings to the JSON object
	cJSON_AddStringToObject(root, "dorsiflexion", dorsiflexionStr);
	cJSON_AddStringToObject(root, "eversion", eversionStr);
	cJSON_AddStringToObject(root, "extension", extensionStr);

	// Print the JSON object
	char *jsonMessage = cJSON_PrintUnformatted(root);

	// Send JSON string over UART
	HAL_UART_Transmit(&huart3, (uint8_t *)jsonMessage, strlen(jsonMessage), HAL_MAX_DELAY);

	free(jsonMessage);
	cJSON_Delete(root);  // Correct way to free cJSON memory
}

uint8_t ManagerMotorHMI_CANExtractControllerID(uint32_t ext_id)
{
	return (uint8_t)(ext_id & 0xFF);
}

void ManagerMotorHMI_SetOrigines()
{
	if (motors[MOTOR_1].position == 0.0 && motors[MOTOR_2].position == 0.0 && motors[MOTOR_3].position == 0.0)
	{
		motorState = READY2MOVE;
		tryCount = 0;
	}
	else if (tryCount < TRY)
	{
		CanMotorServo_SetOrigin(MOTOR_1_CAN_ID);
		HAL_Delay(50);
		CanMotorServo_SetOrigin(MOTOR_2_CAN_ID);
		HAL_Delay(50);
		CanMotorServo_SetOrigin(MOTOR_3_CAN_ID);
		HAL_Delay(50);

		tryCount += 1;
	}
	else
	{
		motorState = ERROR;
		// Return le code d'erreur ??
	}
}

void ManagerMotorHMI_CANVerif()
{
	if (motors[MOTOR_1].detected && motors[MOTOR_2].detected && motors[MOTOR_3].detected)
	{
		motorState = SET_ORIGIN;
	}
}


