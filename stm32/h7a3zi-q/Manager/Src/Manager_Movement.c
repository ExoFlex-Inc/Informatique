
#include <Manager_Movement.h>
#include <Manager_Motor.h>
#include <Manager_HMI.h>

#include <string.h>

// States
#define IDLE  0
#define HOMING 1
#define MANUAL 2
#define AUTOMATIC 3

#define MOTOR_STEP 1

typedef struct
{
	uint8_t state;
	float motorsNextGoal[MOTOR_NBR];

} ManagerMovement_t;

ManagerMovement_t ManagerMovement;

static const Motor* motorsData[MOTOR_NBR];


void ManagerMovement_HomingPositions();
void ManagerMovement_ManualPositions();
void ManagerMovement_AutoPositions();
void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor);


void ManagerMovement_Init()
{
    //Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
    	motorsData[i] = ManagerMotor_GetMotorData(i);
    	ManagerMovement.motorsNextGoal[i] = 0.0f;
    }

    ManagerMovement.state = MANUAL;
}

void ManagerMovement_Task()
{

	switch (ManagerMovement.state)
	{
	case IDLE:

		//TODO: put conditions to change state here
		break;

	case HOMING:
		ManagerMovement_HomingPositions();

		//TODO: put conditions to change state here
		break;

	case MANUAL:
		//Wait for manual cmd or for state change

		//TODO: put conditions to change state here
		break;

	case AUTOMATIC:
		ManagerMovement_AutoPositions();

		//TODO: put conditions to change state here
		break;
	}

	// TODO : with 100ms timer : ManagerHMI_SetMotorData(float posEv, float posD, float posEx);
}


void ManagerMovement_HomingPositions() // TODO
{
	// Homing en utilisant les limits switch, set origine des moteurs
	//faire chaucn des mouvements jusqua limit switch
}

void ManagerMovement_AutoPositions() // TODO:
{
	// Gerer les sequences d'etirements
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
		ManagerMovement_ManualIncrement(motorIndex, 0);
	}
}

void ManagerMovement_ManualCmdHomeAll()
{
	if (ManagerMovement.state == MANUAL)
	{
		ManagerMovement_ManualIncrement(MOTOR_1, 0);
		ManagerMovement_ManualIncrement(MOTOR_2, 0);
		ManagerMovement_ManualIncrement(MOTOR_3, 0);
	}
}


void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor)
{
	//motor is ready when nextPos has been reached
	if (ManagerMotor_IsMotorReady(motorIndex))
	{
		ManagerMovement.motorsNextGoal[motorIndex] = motorsData[motorIndex]->position + factor*MOTOR_STEP;
		ManagerMotor_SetMotorGoal(motorIndex, ManagerMovement.motorsNextGoal[motorIndex]);
	}

	//Else : do nothing so skip command to avoid an accumulation of incrementation
}








