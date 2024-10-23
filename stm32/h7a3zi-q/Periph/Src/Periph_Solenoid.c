#include "Periph_Solenoid.h"

// Define GPIO
#define PS_SOLENOID_EVERSION_PWM 		  &htim1
#define PS_GPIO_SOLENOID_EVERSION_IN1   GPIOD
#define PS_GPIO_SOLENOID_EVERSION_IN2   GPIOD

#define PS_SOLENOID_CHANGESIDE_PWM   		&htim1
#define PS_GPIO_SOLENOID_CHANGESIDE_IN3   GPIOD
#define PS_GPIO_SOLENOID_CHANGESIDE_IN4  	GPIOD

// Define Pins
#define PS_CHANNEL_SOLENOID_EVERSION_PWM 		TIM_CHANNEL_2
#define PS_PIN_SOLENOID_EVERSION_IN1  		GPIO_PIN_4
#define PS_PIN_SOLENOID_EVERSION_IN2  		GPIO_PIN_5

#define PS_CHANNEL_SOLENOID_CHANGESIDE_PWM   	TIM_CHANNEL_3
#define PS_PIN_SOLENOID_CHANGESIDE_IN3    	GPIO_PIN_6
#define PS_PIN_SOLENOID_CHANGESIDE_IN4    	GPIO_PIN_7

#define LOCK_WAITING_DELAY 3000 //ms

#define SOLENOID_PWM_PERCENT 80 //%


uint32_t PeriphSolenoid_SetDutyCycle(TIM_HandleTypeDef *htim, uint32_t channel, float duty_cycle_percent);

/********************************************
 * Unlock the solenoids
 ********************************************/
bool PeriphSolenoid_UnlockChangeSide()
{
	static bool isChangeSideFree = false;
    static uint32_t lastActivationTime = 0;

    uint32_t currentTime = HAL_GetTick();

    if (!isChangeSideFree)
    {
    	uint32_t compare_value = PeriphSolenoid_SetDutyCycle(PS_SOLENOID_CHANGESIDE_PWM, PS_CHANNEL_SOLENOID_CHANGESIDE_PWM, SOLENOID_PWM_PERCENT);

    	// Start PWM
    	__HAL_TIM_SET_COMPARE(PS_SOLENOID_CHANGESIDE_PWM, PS_CHANNEL_SOLENOID_CHANGESIDE_PWM, compare_value);
    	HAL_TIM_PWM_Start(PS_SOLENOID_CHANGESIDE_PWM, PS_CHANNEL_SOLENOID_CHANGESIDE_PWM);

    	HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN3, PS_PIN_SOLENOID_CHANGESIDE_IN3, GPIO_PIN_RESET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN4, PS_PIN_SOLENOID_CHANGESIDE_IN4, GPIO_PIN_SET);

    	lastActivationTime = currentTime;
    	isChangeSideFree = true;
    }

	if (currentTime - lastActivationTime >= LOCK_WAITING_DELAY && isChangeSideFree)
	{
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN3, PS_PIN_SOLENOID_CHANGESIDE_IN3, GPIO_PIN_RESET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN4, PS_PIN_SOLENOID_CHANGESIDE_IN4, GPIO_PIN_RESET);

		HAL_TIM_PWM_Stop(PS_SOLENOID_CHANGESIDE_PWM, PS_CHANNEL_SOLENOID_CHANGESIDE_PWM);
	}
	return isChangeSideFree;
}

bool PeriphSolenoid_UnlockEversion()
{
	static bool isEversionFree = false;
	static uint32_t lastActivationTime = 0;

	uint32_t currentTime = HAL_GetTick();

	if (!isEversionFree)
	{
		uint32_t compare_value = PeriphSolenoid_SetDutyCycle(PS_SOLENOID_EVERSION_PWM, PS_CHANNEL_SOLENOID_EVERSION_PWM, SOLENOID_PWM_PERCENT);

		// Start PWM
		__HAL_TIM_SET_COMPARE(PS_SOLENOID_EVERSION_PWM, PS_CHANNEL_SOLENOID_EVERSION_PWM, compare_value);
		HAL_TIM_PWM_Start(PS_SOLENOID_EVERSION_PWM, PS_CHANNEL_SOLENOID_EVERSION_PWM);

		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN1, PS_PIN_SOLENOID_EVERSION_IN1, GPIO_PIN_SET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN2, PS_PIN_SOLENOID_EVERSION_IN2, GPIO_PIN_RESET);

		lastActivationTime = currentTime;
		isEversionFree = true;
	}

	if (currentTime - lastActivationTime >= LOCK_WAITING_DELAY && isEversionFree)
	{
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN1, PS_PIN_SOLENOID_EVERSION_IN1, GPIO_PIN_RESET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN2, PS_PIN_SOLENOID_EVERSION_IN2, GPIO_PIN_RESET);

		HAL_TIM_PWM_Stop(PS_SOLENOID_EVERSION_PWM, PS_CHANNEL_SOLENOID_EVERSION_PWM);
	}

	return isEversionFree;
}

uint32_t PeriphSolenoid_SetDutyCycle(TIM_HandleTypeDef *htim, uint32_t channel, float duty_cycle_percent)
{
	uint32_t arr = __HAL_TIM_GET_AUTORELOAD(htim);
	uint32_t compare_value = (uint32_t)((duty_cycle_percent / 100.0f) * (arr + 1));
	return compare_value;
}

void PeriphSolenoid_StopPWMs()
{
	HAL_TIM_PWM_Stop(PS_SOLENOID_EVERSION_PWM, PS_CHANNEL_SOLENOID_EVERSION_PWM);
	HAL_TIM_PWM_Stop(PS_SOLENOID_CHANGESIDE_PWM, PS_CHANNEL_SOLENOID_CHANGESIDE_PWM);
}

/********************************************
 * Feet motor control
 ********************************************/





