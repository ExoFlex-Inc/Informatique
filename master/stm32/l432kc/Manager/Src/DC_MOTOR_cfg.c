/*
 * File: DC_MOTOR_cfg.c
 * Driver Name: [[ DC MOTOR ]]
 * SW Layer:   ECUAL
 * Created on: Jun 28, 2020
 * Author:     Khaled Magdy
 * -------------------------------------------
 * For More Information, Tutorials, etc.
 * Visit Website: www.DeepBlueMbedded.com
 *
 */

#include "DC_MOTOR.h"

const DC_MOTOR_CfgType DC_MOTOR_CfgParam[DC_MOTOR_UNITS] =
{
	// DC MOTOR 1 Configurations
    {
	    GPIOB,
		GPIOB,
		GPIO_PIN_7,
		GPIO_PIN_6,
		TIM2,
		TIM_CHANNEL_4,
		32,
		DC_MOTOR_F_PWM,
		DC_MOTOR_PWM_RES
	}
};
