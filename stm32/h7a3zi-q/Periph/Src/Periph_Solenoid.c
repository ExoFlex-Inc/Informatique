#include "Periph_Solenoid.h"

// Define GPIO
// EV: eversion solenoid
#define PS_EV_HTIM      &htim1
#define PS_EV_GPIO1 	GPIOD
#define PS_EV_GPIO2 	GPIOD

// CS: ChangeSide solenoid
#define PS_CS_HTIM      &htim1
#define PS_CS_GPIO3 	GPIOD
#define PS_CS_GPIO4 	GPIOD

// MF: Motor Feet
#define PS_MF_HTIM      &htim1
#define PS_MF_GPIO1 	GPIOD
#define PS_MF_GPIO2 	GPIOD

// Define Pins
#define PS_EV_CHANNEL  TIM_CHANNEL_2
#define PS_EV_PIN1     GPIO_PIN_4
#define PS_EV_PIN2     GPIO_PIN_5

#define PS_CS_CHANNEL  TIM_CHANNEL_3
#define PS_CS_PIN3     GPIO_PIN_6
#define PS_CS_PIN4     GPIO_PIN_7

#define PS_MF_CHANNEL  TIM_CHANNEL_4
#define PS_MF_PIN1     GPIO_PIN_2
#define PS_MF_PIN2     GPIO_PIN_3

#define LOCK_WAITING_DELAY 3000  // ms

#define SOLENOID_PWM_VALUE 80  //%
#define MOTOR_PWM_VALUE 50 //%

bool isEversionFree;
bool isChangeSideFree;

void PeriphSolenoid_ActivateSolenoid(TIM_HandleTypeDef* htim, uint32_t channel,
                                     GPIO_TypeDef* GPIO1, uint16_t pin1,
									 GPIO_TypeDef* GPIO2, uint16_t pin2,
                                     uint32_t compare_value);
void PeriphSolenoid_DeactivateSolenoid(TIM_HandleTypeDef* htim, uint32_t channel,
									   GPIO_TypeDef* GPIO1, uint16_t pin1,
									   GPIO_TypeDef* GPIO2, uint16_t pin2);
uint32_t PeriphSolenoid_SetDutyCycle(TIM_HandleTypeDef* htim, uint32_t channel,
                                     float duty_cycle);
void PeriphSolenoid_StartPWM(TIM_HandleTypeDef* htim, uint32_t channel, uint32_t compare_value);
void PeriphSolenoid_StopPWM(TIM_HandleTypeDef* htim, uint32_t channel);

void PeriphSolenoid_Init()
{
    PeriphSolenoid_ResetLocksState();
}

/********************************************
 * Unlock the solenoids
 ********************************************/
bool PeriphSolenoid_UnlockChangeSide()
{
    static uint32_t lastActivationTime = 0;

    uint32_t currentTime = HAL_GetTick();

    if (!isChangeSideFree)
    {
        uint32_t compare_value = PeriphSolenoid_SetDutyCycle(PS_CS_HTIM, PS_CS_CHANNEL,SOLENOID_PWM_VALUE);

        // Activate Soleinoid
        PeriphSolenoid_ActivateSolenoid(PS_CS_HTIM, PS_CS_CHANNEL, PS_CS_GPIO4,  PS_CS_PIN4, PS_CS_GPIO3, PS_CS_PIN3, compare_value);

        lastActivationTime = currentTime;
        isChangeSideFree   = true;
    }

    if (currentTime - lastActivationTime >= LOCK_WAITING_DELAY &&
        isChangeSideFree)
    {
    	// Deactivate Soleinoid
    	PeriphSolenoid_DeactivateSolenoid(PS_CS_HTIM, PS_CS_CHANNEL, PS_CS_GPIO4, PS_CS_PIN4, PS_CS_GPIO3, PS_CS_PIN3);
    }
    return isChangeSideFree;
}

bool PeriphSolenoid_UnlockEversion()
{
    static uint32_t lastActivationTime = 0;

    uint32_t currentTime = HAL_GetTick();

    if (!isEversionFree)
    {
        uint32_t compare_value = PeriphSolenoid_SetDutyCycle(PS_EV_HTIM, PS_EV_CHANNEL,SOLENOID_PWM_VALUE);

        // Activate Soleinoid
        PeriphSolenoid_ActivateSolenoid(PS_EV_HTIM, PS_EV_CHANNEL, PS_EV_GPIO1,  PS_EV_PIN1, PS_EV_GPIO2, PS_EV_PIN2, compare_value);

        lastActivationTime = currentTime;
        isEversionFree     = true;
    }

    if (currentTime - lastActivationTime >= LOCK_WAITING_DELAY &&
        isEversionFree)
    {
    	PeriphSolenoid_DeactivateSolenoid(PS_EV_HTIM, PS_EV_CHANNEL, PS_EV_GPIO1,  PS_EV_PIN1, PS_EV_GPIO2, PS_EV_PIN2);
    }

    return isEversionFree;
}

/********************************************
 * Feet motor control
 ********************************************/
void periphSolenoid_FootThight()
{
	uint32_t compare_value = PeriphSolenoid_SetDutyCycle(PS_MF_HTIM, PS_MF_CHANNEL, MOTOR_PWM_VALUE);
	PeriphSolenoid_StartPWM(PS_MF_HTIM, PS_MF_CHANNEL, compare_value);

	HAL_GPIO_WritePin(PS_MF_GPIO1, PS_MF_PIN1, GPIO_PIN_RESET);
	HAL_GPIO_WritePin(PS_MF_GPIO2, PS_MF_PIN2, GPIO_PIN_SET);
}

void periphSolenoid_FootLoose()
{
	uint32_t compare_value = PeriphSolenoid_SetDutyCycle(PS_MF_HTIM, PS_MF_CHANNEL, MOTOR_PWM_VALUE);
	PeriphSolenoid_StartPWM(PS_MF_HTIM, PS_MF_CHANNEL, compare_value);

	HAL_GPIO_WritePin(PS_MF_GPIO1, PS_MF_PIN1, GPIO_PIN_SET);
	HAL_GPIO_WritePin(PS_MF_GPIO2, PS_MF_PIN2, GPIO_PIN_RESET);
}

/********************************************
 * Utils
 ********************************************/
uint32_t PeriphSolenoid_SetDutyCycle(TIM_HandleTypeDef* htim, uint32_t channel,
                                     float duty_cycle)
{
    uint32_t arr = __HAL_TIM_GET_AUTORELOAD(htim);
    uint32_t compare_value =
        (uint32_t) ((duty_cycle / 100.0f) * (arr + 1));
    return compare_value;
}

void PeriphSolenoid_StopPWMs()
{
	PeriphSolenoid_StopPWM(PS_EV_HTIM, PS_EV_CHANNEL);
	PeriphSolenoid_StopPWM(PS_CS_HTIM, PS_CS_CHANNEL);
	PeriphSolenoid_StopPWM(PS_MF_HTIM, PS_MF_CHANNEL);
}

void PeriphSolenoid_ResetLocksState()
{
    isChangeSideFree = false;
    isEversionFree   = false;
}

void PeriphSolenoid_ActivateSolenoid(TIM_HandleTypeDef* htim, uint32_t channel,
                                     GPIO_TypeDef* GPIO1, uint16_t pin1,
									 GPIO_TypeDef* GPIO2, uint16_t pin2,
                                     uint32_t compare_value)
{
	PeriphSolenoid_StartPWM(htim, channel, compare_value);

    HAL_GPIO_WritePin(GPIO1, pin1, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(GPIO2, pin2, GPIO_PIN_SET);
}

void PeriphSolenoid_DeactivateSolenoid(TIM_HandleTypeDef* htim, uint32_t channel,
									   GPIO_TypeDef* GPIO1, uint16_t pin1,
									   GPIO_TypeDef* GPIO2, uint16_t pin2)
{
    HAL_GPIO_WritePin(GPIO1, pin1, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(GPIO2, pin2, GPIO_PIN_RESET);

    PeriphSolenoid_StopPWM(htim, channel);
}

void PeriphSolenoid_StartPWM(TIM_HandleTypeDef* htim, uint32_t channel, uint32_t compare_value)
{
	__HAL_TIM_SET_COMPARE(htim, channel, compare_value);
	HAL_TIM_PWM_Start(htim, channel);
}

void PeriphSolenoid_StopPWM(TIM_HandleTypeDef* htim, uint32_t channel)
{
	HAL_TIM_PWM_Stop(htim, channel);
}
