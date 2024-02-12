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

#define MOTOR_STEP 0.1

#define TIMER 100

motorInfo_t motors[MOTOR_NBR];
uint8_t motorIndexes[MOTOR_NBR];
uint32_t timerMs = 0;

//Prototypes
void ManagerMotorHMI_ReceiveFromMotors();
void ManagerMotorHMI_CalculateNextPositions();
void ManagerMotorHMI_SendToMotors();
void ManagerMotorHMI_SendToHMI();
uint8_t ManagerMotorHMI_CANExtractControllerID(uint32_t ext_id);

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
	}
}

void ManagerMotorHMI_Task()
{

	//Machine à état qui prend en compte l'initialisation des moteurs, première lecture et home
	if (HAL_GetTick() - timerMs >= TIMER)
	{
		ManagerMotorHMI_ReceiveFromMotors();

		ManagerMotorHMI_CalculateNextPositions();

		ManagerMotorHMI_SendToMotors();

		ManagerMotorHMI_SendToHMI();

		timerMs = HAL_GetTick();
	}
}



void ManagerMotorHMI_ReceiveFromMotors()
{
	uint8_t received_controller_id = ManagerMotorHMI_CANExtractControllerID(RxHeader.Identifier);

	if (received_controller_id >= 1 && received_controller_id <= 3  )
	{
		uint8_t motorIndex = received_controller_id - 1 ;
		CanMotorServo_Receive(&motors[motorIndex].position, &motors[motorIndex].speed, &motors[motorIndex].current, &motors[motorIndex].temp, &motors[motorIndex].error);
	}
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

	CanMotorServo_SetOrigin(1);
	CanMotorServo_SetOrigin(2);
	CanMotorServo_SetOrigin(3);
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



