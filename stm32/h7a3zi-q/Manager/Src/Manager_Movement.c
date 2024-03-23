
#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <string.h>

// States
#define IDLE      0
#define HOMING    1
#define MANUAL    2
#define AUTOMATIC 3

#define GOAL_STEP 0.1

// Mouvement types
#define DORSIFLEXION 1
#define EVERSION     2
#define EXTENSION    3

typedef struct
{
    uint8_t state;
    float   motorsNextGoal[MOTOR_NBR];

} ManagerMovement_t;

ManagerMovement_t ManagerMovement;

static const Motor* motorsData[MOTOR_NBR];

float finalPos[MOTOR_NBR];

bool test;  // test for automatic functions

void ManagerMovement_HomingPositions();
void ManagerMovement_ManualPositions();
void ManagerMovement_AutoPositions();
void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor);
void ManagerMovement_AutoMouvement(uint8_t mouvType, float* finalPosition);

void ManagerMovement_Init()
{
    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        motorsData[i]                     = ManagerMotor_GetMotorData(i);
        ManagerMovement.motorsNextGoal[i] = 0.0f;
        finalPos[i]                       = 0.0f;
    }
    test                  = true;
    ManagerMovement.state = MANUAL;
}

void ManagerMovement_Task()
{
    switch (ManagerMovement.state)
    {
    case HOMING:
        ManagerMovement_HomingPositions();

        // TODO: put conditions to change state here
        break;

    case MANUAL:
        // Wait for manual cmd or for state change

        // TODO: put conditions to change state here
        break;

    case AUTOMATIC:
        ManagerMovement_AutoPositions();

        // TODO: put conditions to change state here
        break;
    }

    // TODO : with 100ms timer : ManagerHMI_SetMotorData(float posEv, float
    // posD, float posEx);
}

void ManagerMovement_HomingPositions()  // TODO
{
    // Homing en utilisant les limits switch, set origine des moteurs
    // faire chaucn des mouvements jusqua limit switch
}

void ManagerMovement_AutoPositions()  // TODO:
{
    // Gerer les sequences d'etirements

    // tests
    //	if(ManagerMotor_IsMotorReady(MOTOR_1) &&
    //ManagerMotor_IsMotorReady(MOTOR_2) && ManagerMotor_IsMotorReady(MOTOR_3)
    //&& ManagerMotor_GetState() == READY2MOVE && test)
    //	{
    //		finalPos[MOTOR_1] = 2.0f;
    //		finalPos[MOTOR_2] = 2.0f;
    //		finalPos[MOTOR_3] = 2.0f;
    //
    //		ManagerMovement_AutoMouvement(DORSIFLEXION, finalPos);
    //		ManagerMovement_AutoMouvement(EXTENSION, finalPos);
    //		test = false;
    //	}
}

void ManagerMovement_ManualCmdEversion(int8_t direction)
{
    if (ManagerMovement.state == MANUAL)
    {
        ManagerMovement_ManualIncrement(MOTOR_1, -1 * direction);
        ManagerMovement_ManualIncrement(MOTOR_2, 1 * direction);
    }
}

void ManagerMovement_ManualCmdDorsiflexion(int8_t direction)
{
    if (ManagerMovement.state == MANUAL)
    {
        ManagerMovement_ManualIncrement(MOTOR_1, 1 * direction);
        ManagerMovement_ManualIncrement(MOTOR_2, 1 * direction);
    }
}

void ManagerMovement_ManualCmdExtension(int8_t direction)
{
    if (ManagerMovement.state == MANUAL)
    {
        ManagerMovement_ManualIncrement(MOTOR_3, 1 * direction);
    }
}

void ManagerMovement_ManualCmdHome(uint8_t motorIndex)
{
    if (ManagerMovement.state == MANUAL)
    {
        ManagerMovement.motorsNextGoal[motorIndex] = 0.0;
        ManagerMotor_SetMotorGoal(motorIndex,
                                  ManagerMovement.motorsNextGoal[motorIndex]);
        ManagerMotor_SetMotorGoalState(motorIndex, true);
    }
}

void ManagerMovement_ManualCmdHomeAll()
{
    ManagerMovement_ManualCmdHome(MOTOR_1);
    ManagerMovement_ManualCmdHome(MOTOR_2);
    ManagerMovement_ManualCmdHome(MOTOR_3);
}

void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor)
{
    // motor is ready when nextPos has been reached
    if (!ManagerMotor_IsGoalStateReady(motorIndex))
    {
        ManagerMovement.motorsNextGoal[motorIndex] =
            motorsData[motorIndex]->position + factor * GOAL_STEP;
        ManagerMotor_SetMotorGoal(motorIndex,
                                  ManagerMovement.motorsNextGoal[motorIndex]);
        ManagerMotor_SetMotorGoalState(motorIndex, true);
    }

    // Else : do nothing so skip command to avoid an accumulation of
    // incrementation
}

void ManagerMovement_AutoMouvement(uint8_t mouvType, float* Position)
{
    if (ManagerMovement.state == AUTOMATIC)
    {
        if (mouvType == DORSIFLEXION)  // Set goalPosition for motor 1 and 2 for
                                       // dorsiflexion
        {
            ManagerMovement.motorsNextGoal[MOTOR_1] = Position[MOTOR_1];
            ManagerMotor_SetMotorGoal(MOTOR_1,
                                      ManagerMovement.motorsNextGoal[MOTOR_1]);
            ManagerMotor_SetMotorGoalState(MOTOR_1, true);

            ManagerMovement.motorsNextGoal[MOTOR_2] = Position[MOTOR_2];
            ManagerMotor_SetMotorGoal(MOTOR_2,
                                      ManagerMovement.motorsNextGoal[MOTOR_2]);
            ManagerMotor_SetMotorGoalState(MOTOR_2, true);
        }
        else if (mouvType ==
                 EVERSION)  // Set goalPosition for motor 1 and 2 for eversion
        {
            ManagerMovement.motorsNextGoal[MOTOR_1] = -Position[MOTOR_1];
            ManagerMotor_SetMotorGoal(MOTOR_1,
                                      ManagerMovement.motorsNextGoal[MOTOR_1]);
            ManagerMotor_SetMotorGoalState(MOTOR_1, true);

            ManagerMovement.motorsNextGoal[MOTOR_2] = Position[MOTOR_2];
            ManagerMotor_SetMotorGoal(MOTOR_2,
                                      ManagerMovement.motorsNextGoal[MOTOR_2]);
            ManagerMotor_SetMotorGoalState(MOTOR_2, true);
        }
        else if (mouvType ==
                 EXTENSION)  // Set goalPosition for motor 3 for extension
        {
            ManagerMovement.motorsNextGoal[MOTOR_3] = Position[MOTOR_3];
            ManagerMotor_SetMotorGoal(MOTOR_3,
                                      ManagerMovement.motorsNextGoal[MOTOR_3]);
            ManagerMotor_SetMotorGoalState(MOTOR_3, true);
        }
    }
}
