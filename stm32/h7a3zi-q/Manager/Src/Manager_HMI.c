#include <Manager_HMI.h>


#include "comUtils_UART2.h"
#include "cJSON.h"
#include "uartRingBufDMA.h"

#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#define M_HMI_TIMER 100


typedef struct
{
    char   posEversion[STR_LENGTH];
    char   posDorsiflexion[STR_LENGTH];
    char   posExtension[STR_LENGTH];
} managerHMI_t;

managerHMI_t managerHMI;


static uint32_t timerMs = 0;

void ManagerHMI_SendJSON();


void ManagerHMI_Init()
{
	ManagerHMI_SetMotorData(0, 0, 0);

	cJSON_InitHooks(NULL);
	Ringbuf_Init();

}

void ManagerHMI_Task()
{
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
    cJSON_AddStringToObject(root, "dorsiflexion", managerHMI.posDorsiflexion);
    cJSON_AddStringToObject(root, "eversion", managerHMI.posEversion);
    cJSON_AddStringToObject(root, "extension", managerHMI.posExtension);

    // Print the JSON object
    char* jsonMessage = cJSON_PrintUnformatted(root);

    // Send JSON string over UART
    HAL_UART_Transmit(&huart3, (uint8_t*) jsonMessage, strlen(jsonMessage),
                      HAL_MAX_DELAY);

    free(jsonMessage);
    cJSON_Delete(root);  // Correct way to free cJSON memory

}

void ManagerHMI_ReceiveJSON(char* foundWord)
{
	foundWord = searchWord((char*) MainBuf_UART);
}

void ManagerHMI_SetMotorData(float posEv, float posD, float posEx)
{
    sprintf(managerHMI.posDorsiflexion, "%.2f", posD);
    sprintf(managerHMI.posEversion, "%.2f", posEv);
    sprintf(managerHMI.posExtension, "%.2f", posEx);
}

//void ManagerHMI_SetMotorData(float posEv, float posD, float posEx)
//{
//    sprintf(managerHMI.posDorsiflexion, "%.2f", posD);
//    sprintf(managerHMI.posEversion, "%.2f", posEv);
//    sprintf(managerHMI.posExtension, "%.2f", posEx);
//}




