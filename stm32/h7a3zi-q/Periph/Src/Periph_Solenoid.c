#include "Periph_Solenoid.h"

// Define GPIO
#define PS_GPIO_SOLENOID_CHANGESIDE_EN    GPIOD
#define PS_GPIO_SOLENOID_CHANGESIDE_IN1   GPIOD
#define PS_GPIO_SOLENOID_CHANGESIDE_IN2   GPIOD

#define PS_GPIO_SOLENOID_EVERSION_EN    GPIOD
#define PS_GPIO_SOLENOID_EVERSION_IN3   GPIOD
#define PS_GPIO_SOLENOID_EVERSION_IN4  	GPIOE

// Define Pins
#define PS_PIN_SOLENOID_CHANGESIDE_EN 	GPIO_PIN_3
#define PS_PIN_SOLENOID_CHANGESIDE_IN1  GPIO_PIN_4
#define PS_PIN_SOLENOID_CHANGESIDE_IN2  GPIO_PIN_5

#define PS_PIN_SOLENOID_EVERSION_EN    	GPIO_PIN_6
#define PS_PIN_SOLENOID_EVERSION_IN3    GPIO_PIN_7
#define PS_PIN_SOLENOID_EVERSION_IN4    GPIO_PIN_2

#define PIN_WAIT 20 //ms


/********************************************
 * Unlock the solenoids
 ********************************************/
bool PeriphSolenoid_UnlockChangeSide()
{
	static bool isLock = false;
	static bool isEnable = false;
    static uint32_t lastActivationTime = 0;

    uint32_t currentTime = HAL_GetTick();

    if (!isEnable)
    {
    	HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_EN, PS_PIN_SOLENOID_CHANGESIDE_EN, GPIO_PIN_SET);
    	lastActivationTime = currentTime;

    	isEnable = true;
    }

	if (currentTime - lastActivationTime >= PIN_WAIT)
	{
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN1, PS_PIN_SOLENOID_CHANGESIDE_IN1, GPIO_PIN_SET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN2, PS_PIN_SOLENOID_CHANGESIDE_IN2, GPIO_PIN_SET);

		isLock = true;
	}
	return isLock;
}

bool PeriphSolenoid_UnlockEversion()
{
	static bool isLock = false;
	static bool isEnable = false;
    static uint32_t lastActivationTime = 0;

    uint32_t currentTime = HAL_GetTick();

    if (!isEnable)
    {
    	HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_EN, PS_PIN_SOLENOID_EVERSION_EN, GPIO_PIN_SET);
    	lastActivationTime = currentTime;

    	isEnable = true;
    }

	if (currentTime - lastActivationTime >= PIN_WAIT)
	{
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN3, PS_PIN_SOLENOID_EVERSION_IN3, GPIO_PIN_SET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN4, PS_PIN_SOLENOID_EVERSION_IN4, GPIO_PIN_SET);

		isLock = true;
	}
	return isLock;
}
/********************************************
 * Lock the solenoids
 ********************************************/
bool PeriphSolenoid_LockChangeSide()
{
	static bool isUnlock = false;
	static bool isDisable = false;
    static uint32_t lastActivationTime = 0;

    uint32_t currentTime = HAL_GetTick();

    if (!isDisable)
    {
    	HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_EN, PS_PIN_SOLENOID_CHANGESIDE_EN, GPIO_PIN_RESET);
    	lastActivationTime = currentTime;

    	isDisable = true;
    }

	if (currentTime - lastActivationTime >= PIN_WAIT)
	{
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN1, PS_PIN_SOLENOID_CHANGESIDE_IN1, GPIO_PIN_RESET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_CHANGESIDE_IN2, PS_PIN_SOLENOID_CHANGESIDE_IN2, GPIO_PIN_RESET);

		isUnlock = true;
	}
	return isUnlock;
}

bool PeriphSolenoid_LockEversion()
{
	static bool isUnlock = false;
	static bool isDisable = false;
    static uint32_t lastActivationTime = 0;

    uint32_t currentTime = HAL_GetTick();

    if (!isDisable)
    {
    	HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_EN, PS_PIN_SOLENOID_EVERSION_EN, GPIO_PIN_RESET);
    	lastActivationTime = currentTime;

    	isDisable = true;
    }

	if (currentTime - lastActivationTime >= PIN_WAIT)
	{
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN3, PS_PIN_SOLENOID_EVERSION_IN3, GPIO_PIN_RESET);
		HAL_GPIO_WritePin(PS_GPIO_SOLENOID_EVERSION_IN4, PS_PIN_SOLENOID_EVERSION_IN4, GPIO_PIN_RESET);

		isUnlock = true;
	}
	return isUnlock;
}

/********************************************
 * Feet motor control
 ********************************************/








