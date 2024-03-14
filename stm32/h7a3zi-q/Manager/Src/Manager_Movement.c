
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

} ManagerMovement_t;

ManagerMovement_t ManagerMovement;


void ManagerMovement_HomingPositions();
void ManagerMovement_ManualPositions();
void ManagerMovement_AutoPositions();
void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor);


void ManagerMovement_Init()
{
	ManagerMovement.state = MANUAL;
}

void ManagerMovement_Task()
{

	switch (ManagerMovement.state)
	{
	case IDLE:
		break;

	case HOMING:
		ManagerMovement_HomingPositions();
		break;

	case MANUAL:
		ManagerMovement_ManualPositions();
		break;

	case AUTOMATIC:
		ManagerMovement_AutoPositions();
		break;
	}

	// TODO : with 100ms timer : ManagerHMI_SetMotorData(float posEv, float posD, float posEx);
}


void ManagerMovement_HomingPositions() // TODO
{
	// Homing en utilisant les limits switch, set origine des moteurs
	//faire chaucn des mouvements jusqua limit switch
}

void ManagerMovement_ManualPositions() // TODO: Changer ce qui a dans les if pour des fonctions separees
{
	char foundWord[STR_LENGTH];

	ManagerHMI_ReceiveJSON(foundWord);

	if (strcmp(foundWord, "eversionR") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_1, -1);
		ManagerMovement_ManualIncrement(MOTOR_2, 1);
	}
	else if (strcmp(foundWord, "eversionL") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_1, 1);
		ManagerMovement_ManualIncrement(MOTOR_2, -1);
	}
	else if (strcmp(foundWord, "dorsiflexionU") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_1, 1);
		ManagerMovement_ManualIncrement(MOTOR_2, 1);
	}
	else if (strcmp(foundWord, "dorsiflexionD") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_1, -1);
		ManagerMovement_ManualIncrement(MOTOR_2, -1);
	}
	else if (strcmp(foundWord, "extensionU") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_3, 1);
	}
	else if (strcmp(foundWord, "extensionD") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_3, -1);
	}
	else if (strcmp(foundWord, "goHome1") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_1, 0);
	}
	else if (strcmp(foundWord, "goHome2") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_2, 0);
	}
	else if (strcmp(foundWord, "goHome3") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_3, 0);
	}
	else if (strcmp(foundWord, "goHome") == 0)
	{
		ManagerMovement_ManualIncrement(MOTOR_1, 0);
		ManagerMovement_ManualIncrement(MOTOR_2, 0);
		ManagerMovement_ManualIncrement(MOTOR_3, 0);
	}
}

void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor)
{
	ManagerMotor_SetMotorNextPos(motorIndex, 0);

	//motors[motorIndex].nextPosition += factor*MOTOR_STEP;
}


void ManagerMovement_AutoPositions() // TODO:
{
	// Gerer les sequences d'etirements
}






