/*
 * Manager_Security.c
 *
 *  Created on: Mar 25, 2024
 *      Author: Charles Henri
 */

#include <Manager_Motor.h>

#define MS_STATE_IDLE 0
#define MS_STATE_WATCHING 1
#define MS_STATE_STOPPING 2
#define MS_STATE_ERROR 3
#define MS_STATE_RESET 4


typedef struct
{
    uint8_t state;

} ManagerSecurity_t;
void ManagerSecurity_Idle();
void ManagerSecurity_Watch();
void ManagerSecurity_Stop();
void ManagerSecurity_Error();
void ManagerSecurity_Reset();


bool ManagerSecurity_VerifMotors();
bool ManagerSecurity_VerifMouvement();
bool ManagerSecurity_VerifHMI();
bool ManagerSecurity_VerifCanbus();
bool ManagerSecurity_VerifLimitSwitch();



ManagerSecurity_t ManagerSecurity;
static const Motor* motorsData[MOTOR_NBR];


void ManagerSecurity_Init()
{
    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        motorsData[i]                     = ManagerMotor_GetMotorData(i);
    }

    ManagerSecurity.state = MS_STATE_IDLE;
}

void ManagerSecurity_Task()
{
	switch (ManagerSecurity.state)
	    {
	    case MS_STATE_IDLE:
	    	ManagerSecurity_Idle();

	        break;

	    case MS_STATE_WATCHING:
	    	ManagerSecurity_Watch();
	        break;

	    case MS_STATE_STOPPING:
	    	ManagerSecurity_Stop();
	    	break;

	    case MS_STATE_ERROR:
	    	ManagerSecurity_Error();
	        break;

	    case MS_STATE_RESET:
	    	ManagerSecurity_Reset();
	        break;
	    }
}

void ManagerSecurity_Idle()
{
	//Verif that motors stopped and managers are in idle

	ManagerSecurity.state = MS_STATE_WATCHING;
}


void ManagerSecurity_Watch()
{
	if  (!ManagerSecurity_VerifMotors())
	{
		ManagerSecurity.state = MS_STATE_STOPPING;
		return;
	}

	if  (!ManagerSecurity_VerifMouvement())
	{
		ManagerSecurity.state = MS_STATE_STOPPING;
		return;
	}

	if  (!ManagerSecurity_VerifHMI())
	{
		ManagerSecurity.state = MS_STATE_STOPPING;
		return;
	}

	if  (!ManagerSecurity_VerifCanbus())
	{
		ManagerSecurity.state = MS_STATE_STOPPING;
		return;
	}

	if  (!ManagerSecurity_VerifLimitSwitch())
	{
		ManagerSecurity.state = MS_STATE_STOPPING;
		return;
	}
}

void ManagerSecurity_Stop()
{
	//Call functions to set error

	//Verif that motors stopped and managers are in error

	ManagerSecurity.state = MS_STATE_ERROR;
}

void ManagerSecurity_Error()
{

	//If reset is requested

	ManagerSecurity.state = MS_STATE_RESET;
}

void ManagerSecurity_Reset()
{

	//Verif that motors stopped and managers are idle

	ManagerSecurity.state = MS_STATE_WATCHING;
}

bool ManagerSecurity_VerifMotors()
{
	bool ret = true;

	return ret;
}

bool ManagerSecurity_VerifMouvement()
{
	bool ret = true;

	return ret;
}

bool ManagerSecurity_VerifHMI()
{
	bool ret = true;

	return ret;
}

bool ManagerSecurity_VerifCanbus()
{
	bool ret = true;

	return ret;
}

bool ManagerSecurity_VerifLimitSwitch()
{
	bool ret = true;

	return ret;
}






