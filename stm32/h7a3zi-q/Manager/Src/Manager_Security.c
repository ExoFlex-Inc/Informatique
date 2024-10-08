/*
 * Manager_Security.c
 *
 *  Created on: Mar 25, 2024
 *      Author: Charles Henri
 */

#include <Manager_Error.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <Periph_Switch.h>

#define MS_STATE_IDLE     0
#define MS_STATE_WATCHING 1
#define MS_STATE_STOPPING 2
#define MS_STATE_ERROR    3
#define MS_STATE_RESET    4

#define MS_MAX_CYCLE_MS 4

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
bool ManagerSecurity_VerifCycleMS();

ManagerSecurity_t   ManagerSecurity;
static const Motor* motorsData[MMOT_MOTOR_NBR];

uint32_t lastTime;
uint32_t cycleTime;

void ManagerSecurity_Init()
{
    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motorsData[i] = ManagerMotor_GetMotorData(i);
    }

    ManagerSecurity.state = MS_STATE_IDLE;
    ManagerSecurity.reset = false;

    cycleTime = 0;
    lastTime  = HAL_GetTick();
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
        ManagerError_SetError(ERROR_0_MSEC);
        break;
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

    if (!ManagerSecurity_VerifLimitSwitch())
    {
        ManagerSecurity.state = MS_STATE_STOPPING;
        return;
    }

    if (!ManagerSecurity_VerifCycleMS())
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
        ManagerError_ResetAllErrors();

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

bool ManagerSecurity_VerifLimitSwitch()
{
    bool ret = true;

    uint8_t managerMovementState = ManagerMovement_GetState();

    if (managerMovementState != MMOV_STATE_HOMING)
    {
        if (PeriphSwitch_ExtensionUp())
        {
            ManagerError_SetError(ERROR_4_LS_EXT_UP);
            ret = false;
        }
        if (PeriphSwitch_ExtensionDown())
        {
            ManagerError_SetError(ERROR_5_LS_EXT_DOWN);
            ret = false;
        }
        if (PeriphSwitch_DorsiflexionUp())
        {
            ManagerError_SetError(ERROR_10_LS_DORS_UP);
            ret = false;
        }
        if (PeriphSwitch_DorsiflexionDown())
        {
            ManagerError_SetError(ERROR_11_LS_DORS_DOWN);
            ret = false;
        }
        if (PeriphSwitch_EversionLeft())
        {
            ManagerError_SetError(ERROR_8_LS_EVER_UP);
            ret = false;
        }
        if (PeriphSwitch_EversionRight())
        {
            ManagerError_SetError(ERROR_9_LS_EVER_DOWN);
            ret = false;
        }
        return ret;
    }

    return ret;
}

bool ManagerSecurity_VerifCycleMS()
{
    bool ret = true;

    cycleTime = HAL_GetTick() - lastTime;
    lastTime  = HAL_GetTick();

    if (cycleTime > MS_MAX_CYCLE_MS)
    {
        ret = false;
        ManagerError_SetError(ERROR_12_CYCLEMS);
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
