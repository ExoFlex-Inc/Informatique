/*
 * Manager_Security.c
 *
 *  Created on: Mar 25, 2024
 *      Author: Charles Henri
 */

#include <Manager_Motor.h>
#include <Manager_Movement.h>

#define MS_STATE_IDLE     0
#define MS_STATE_WATCHING 1
#define MS_STATE_STOPPING 2
#define MS_STATE_ERROR    3
#define MS_STATE_RESET    4

#define MS_MOVING_MAX_SPEED 0.5
#define MS_MOVING_MAX_TORQUE 2
#define MS_IDLE_MAX_SPEED 0.05
#define MS_IDLE_MAX_TORQUE 0.5


typedef struct
{
    uint8_t state;
    bool    reset;

} ManagerSecurity_t;
void ManagerSecurity_Idle();
void ManagerSecurity_Watch();
void ManagerSecurity_Stop();
void ManagerSecurity_Error();
void ManagerSecurity_Reset();

bool ManagerSecurity_VerifMotors();
bool ManagerSecurity_VerifMouvement();
bool ManagerSecurity_VerifCanbus();
bool ManagerSecurity_VerifLimitSwitch();

ManagerSecurity_t   ManagerSecurity;
static const Motor* motorsData[MMOT_MOTOR_NBR];

bool securityTestError;
bool securityTestReset;

void ManagerSecurity_Init()
{
    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motorsData[i] = ManagerMotor_GetMotorData(i);
    }

    ManagerSecurity.state = MS_STATE_IDLE;
    ManagerSecurity.reset = false;

    securityTestError = true;
    securityTestReset = false;
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
    }

    if (securityTestReset)
    {
        ManagerSecurity_Reset();
        securityTestReset = false;
        securityTestError = true;
    }
}

void ManagerSecurity_Idle()
{
    if (ManagerMotor_IsWaitingSecurity() && ManagerMovement_IsWaitingSecurity())
    {
        ManagerMotor_SecurityPassed();
        ManagerMovement_SecurityPassed();

        ManagerSecurity.state = MS_STATE_WATCHING;
    }
}

void ManagerSecurity_Watch()
{
    if (!ManagerSecurity_VerifMotors())
    {
        ManagerSecurity.state = MS_STATE_STOPPING;
        return;
    }

    if (!ManagerSecurity_VerifMouvement())
    {
        ManagerSecurity.state = MS_STATE_STOPPING;
        return;
    }

    if (!ManagerSecurity_VerifCanbus())
    {
        ManagerSecurity.state = MS_STATE_STOPPING;
        return;
    }

    if (!ManagerSecurity_VerifLimitSwitch())
    {
        ManagerSecurity.state = MS_STATE_STOPPING;
        return;
    }

    if (!securityTestError)
    {
        ManagerSecurity.state = MS_STATE_STOPPING;
        return;
    }
}

void ManagerSecurity_Stop()
{
    // Call functions to set error
    ManagerMotor_SetError();
    ManagerMovement_SetError();

    if (ManagerMotor_InError() && ManagerMovement_InError())
    {
        ManagerSecurity.state = MS_STATE_ERROR;
    }
}

void ManagerSecurity_Error()
{
    // If reset is requested

    if (ManagerSecurity.reset)
    {
        ManagerMotor_Reset();
        ManagerMovement_Reset();
        ManagerSecurity.reset = false;

        ManagerSecurity.state = MS_STATE_IDLE;
    }
}

bool ManagerSecurity_VerifMotors()
{
    bool ret = true;

    uint8_t managerMotorState = ManagerMotor_GetState();

    if (managerMotorState == MMOT_STATE_ERROR)
    {
    	ret = false;
    }

    else if (managerMotorState == MMOT_STATE_READY2MOVE)
    {
        for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
        {
        	if (motorsData[i]->velocity > MS_MOVING_MAX_SPEED || motorsData[i]->velocity < -MS_MOVING_MAX_SPEED)
        	{
        		ret = false;
        		break;
        	}

        	if (motorsData[i]->torque > MS_MOVING_MAX_TORQUE || motorsData[i]->torque < -MS_MOVING_MAX_TORQUE )
        	{
        		ret = false;
        		break;
        	}
        }
    }

    else
    {
        for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
        {
        	if (motorsData[i]->velocity > MS_IDLE_MAX_SPEED || motorsData[i]->velocity < -MS_IDLE_MAX_SPEED)
        	{
        		ret = false;
        		break;
        	}

        	if (motorsData[i]->torque > MS_IDLE_MAX_TORQUE || motorsData[i]->torque < -MS_IDLE_MAX_TORQUE)
        	{
        		ret = false;
        		break;
        	}
        }
    }

    return ret;
}

bool ManagerSecurity_VerifMouvement()
{
    bool ret = true;

    uint8_t managerMovementState = ManagerMovement_GetState();

    if (managerMovementState == MMOV_STATE_ERROR)
    {
    	ret = false;
    }

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

    uint8_t managerMovementState = ManagerMovement_GetState();

    if (managerMovementState != MMOV_STATE_HOMING)
    {
//    	if (PeriphSwitch_AnySwitch())
//    	{
//    		ret = false;
//    	}
    }

    return ret;
}

void ManagerSecurity_Reset()
{
    if (ManagerSecurity.state == MS_STATE_ERROR)
    {
        ManagerSecurity.reset = true;
    }
}
