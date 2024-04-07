#include <Manager_HMI.h>
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


static uint32_t     timerMs = 0;
char                ParsedMsg[SECTION_NBR][SECTION_LENGTH];
char                buf[BUF_LENGTH];

void ManagerHMI_ReceiveJSON();
void ManagerHMI_SendJSON();

void ManagerHMI_Init()
{
    cJSON_InitHooks(NULL);
}

void ManagerHMI_Task()
{

    if (HAL_GetTick() - timerMs >= M_HMI_TIMER)
    {
        ManagerHMI_SendJSON();

        timerMs = HAL_GetTick();
    }
}

// Function to generate random number within a range
int getRandomNumber(int min, int max) {
    return min + rand() % (max - min + 1);
}

// Function to generate random positions and torques
void generateRandomData(int positions[], int torques[], int numMotors) {
    for (int i = 0; i < numMotors; i++) {
        positions[i] += getRandomNumber(-2, 2); // Change position by ±2
        torques[i] = getRandomNumber(0, 20); // Random torque value between 0 and 20
    }
}

// Function to send JSON message with random data over UART
void ManagerHMI_SendJSON() {
    cJSON* root = cJSON_CreateObject();

    // Add mode, exercise, repetitions, sets, and errorcode to the JSON object
    cJSON_AddStringToObject(root, "Mode", "Auto");
    cJSON_AddStringToObject(root, "AutoState", "WaitingForPlan");
    cJSON_AddStringToObject(root, "HomingState", "");
    cJSON_AddNumberToObject(root, "ExerciseIdx", 0);
    cJSON_AddNumberToObject(root, "Repetitions", 1);
    cJSON_AddStringToObject(root, "ErrorCode", "");

    // Example arrays containing position and torque values for each motor
    int positions[] = {10, 20, 30}; // Example position values for motors 1, 2, and 3
    int torques[] = {5, 10, 15};     // Example torque values for motors 1, 2, and 3

    // Generate random data for positions and torques
    generateRandomData(positions, torques, sizeof(positions) / sizeof(positions[0]));

    // Add positions and torques arrays to the JSON object
    cJSON* positionsArray = cJSON_CreateIntArray(positions, sizeof(positions) / sizeof(positions[0]));
    cJSON* torquesArray = cJSON_CreateIntArray(torques, sizeof(torques) / sizeof(torques[0]));

    // Add positions and torques arrays to the JSON object
    cJSON_AddItemToObject(root, "Positions", positionsArray);
    cJSON_AddItemToObject(root, "Torques", torquesArray);

    // Print the JSON object
    char* jsonMessage = cJSON_PrintUnformatted(root);

    // Send JSON string over UART
    PeriphUartRingBuf_Send(jsonMessage, strlen(jsonMessage));

    // Clean up memory
    free(jsonMessage);
    cJSON_Delete(root);
}




