
#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <string.h>

// States
#define IDLE      0
#define HOMING    1
#define MANUAL    2
#define AUTOMATIC 3

//Auto states
#define AUTO_IDLE 0
#define AUTO_2GOAL 1
#define AUTO_STRETCHING 2
#define AUTO_2FIRST_POS 3

#define GOAL_STEP 0.03

// Mouvement types
#define DORSIFLEXION 1
#define EVERSION     2
#define EXTENSION    3

#define MAX_EXERCISES 5

typedef struct
{
    uint8_t state;
    uint8_t autoState;
    float   motorsNextGoal[MOTOR_NBR];

} ManagerMovement_t;

ManagerMovement_t ManagerMovement;

static const Motor* motorsData[MOTOR_NBR];

// Auto setup
uint8_t exerciseIdx;
uint8_t repsCount;

uint8_t exercises[MAX_EXERCISES];
uint8_t repetitions[MAX_EXERCISES];
float exercisesTime[MAX_EXERCISES];
float finalPos[MAX_EXERCISES];
float firstPos[MAX_EXERCISES];

bool commandSent;
static uint32_t exerciseTimer  = 0;

// Buttons
bool startButton;
bool nextButton;

//Auto mouvements
void ManagerMovement_AutoIdle();
void ManagerMovement_Auto2Goal();
void ManagerMovement_AutoStrectching();
void ManagerMovement_Auto2FirstPos();

void ManagerMovement_SetFirstPos(uint8_t exerciseIdx);

//Buttons functions
void ManagerMovement_VerifyStopButton();

//Manual functions
void ManagerMovement_HomingPositions();
void ManagerMovement_ManualPositions();
void ManagerMovement_AutoPositions();
void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor);
void ManagerMovement_AutoMovement(uint8_t mouvType, float Position);

bool test;

void ManagerMovement_Init()
{
    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        motorsData[i]                     = ManagerMotor_GetMotorData(i);
        ManagerMovement.motorsNextGoal[i] = 0.0f;

    }

    for (uint8_t i = 0; i < MAX_EXERCISES; i++)
    {
    	finalPos[i]                      = 0.0f;
    	firstPos[i]                      = 0.0f;

		exercises[i] = 0;
		repetitions[i] = 0;
		exercisesTime[i] = 0.0f;
    }

    startButton = false;
    nextButton = false;

    exerciseIdx = 0;
    repsCount= 0;

    test = true;

    commandSent = false;
    ManagerMovement.state = MANUAL;
    ManagerMovement.autoState = AUTO_IDLE;
}

void ManagerMovement_Task()
{
	if (ManagerMotor_GetState() == READY2MOVE)
	{
		switch (ManagerMovement.state)
			{
			case HOMING:
				ManagerMovement_HomingPositions();

				break;

			case MANUAL:
				// Wait for manual cmd or for state change

				break;

			case AUTOMATIC:

				ManagerMovement_AutoPositions();
				if (test)
				{
					// Ex1
					ManagerMovement_AddExercise(0, DORSIFLEXION, 3, 5000.0);
					ManagerMovement_SetFinalPos(0, -2);

					// Ex2
					ManagerMovement_AddExercise(1, EXTENSION, 2, 2000.0);
					ManagerMovement_SetFinalPos(1, -1);

					// Ex3
					ManagerMovement_AddExercise(2, EVERSION, 3, 5000.0);
					ManagerMovement_SetFinalPos(2, 3);

					// Start Exs
					ManagerMovement_StartExercise();

					test = false;
				}

				break;
			}
	}
    // TODO : with 100ms timer : ManagerHMI_SetMotorData(float posEv, float
    // posD, float posEx);
}

/*
 * Utilities
 */
uint8_t ManagerMovement_GetState()
{
	return ManagerMovement.state;
}

void ManagerMovement_SetState(uint8_t state)
{
	ManagerMovement.state = state;
}

/*
 * Auto setup
 */
void ManagerMovement_AddExercise(uint8_t exerciseIdx, uint8_t exerciseType, uint8_t reps, float time)
{
	exercises[exerciseIdx] = exerciseType;
	repetitions[exerciseIdx] = reps;
	exercisesTime[exerciseIdx] = time;
}

void ManagerMovement_ResetExercise()
{
	for (uint8_t i = 0; i < MAX_EXERCISES; i++)
	{
		exercises[i] = 0;
		repetitions[i] = 0;
		exercisesTime[i] = 0.0f;
		finalPos[i] = 0.0f;
	}
}

void ManagerMovement_SetFinalPos(uint8_t exerciseIdx, float finalPosition)
{
	finalPos[exerciseIdx] = finalPosition;
}

void ManagerMovement_StartExercise()
{
	startButton = true;
}

void ManagerMovement_StopExercise()
{
	startButton = false;
}

void ManagerMovement_NextExercise()
{
	nextButton = true;
}

void ManagerMovement_VerifyStopButton()
{
	if (!startButton)
	{
		ManagerMovement.autoState = AUTO_IDLE;
	}
}

void ManagerMovement_SetFirstPos(uint8_t exerciseIdx)
{
	if (exercises[exerciseIdx] == DORSIFLEXION || exercises[exerciseIdx] == EVERSION)
	{
		firstPos[exerciseIdx] = motorsData[MOTOR_1]->position; // Set first position for exercies idx to the initial position
	}
	else if (exercises[exerciseIdx] == EXTENSION)
	{
		firstPos[exerciseIdx] = motorsData[MOTOR_3]->position;
	}
}
/*
 * Auto movements
 */
void ManagerMovement_AutoPositions()
{
    // Gerer les sequences d'etirements
	ManagerMovement_VerifyStopButton();

	switch (ManagerMovement.autoState)
	{
	case AUTO_IDLE:
		ManagerMovement_AutoIdle();

		break;

	case AUTO_2GOAL:
		ManagerMovement_Auto2Goal();

		break;

	case AUTO_STRETCHING:
		ManagerMovement_AutoStrectching();

		break;

	case AUTO_2FIRST_POS:
		ManagerMovement_Auto2FirstPos();

		break;
	}
}

void ManagerMovement_AutoIdle()
{
	// Waiting for button next and or start

	if (startButton && exercises[exerciseIdx] != 0 && exerciseIdx != MAX_EXERCISES)
	{
		// Set the position that the exercise is starting
		if (repsCount == 0)
		{
			ManagerMovement_SetFirstPos(exerciseIdx);
		}

		if (nextButton || exerciseIdx == 0 || repsCount != 0)
		{
			ManagerMovement.autoState = AUTO_2GOAL;
			nextButton = false;
		}
	}
}

void ManagerMovement_Auto2Goal()
{
	if (!ManagerMotor_IsGoalStateReady(MOTOR_1) && !ManagerMotor_IsGoalStateReady(MOTOR_2) && !ManagerMotor_IsGoalStateReady(MOTOR_3) && !commandSent)
	{
		ManagerMovement_AutoMovement(exercises[exerciseIdx], finalPos[exerciseIdx]);
		commandSent = true;
	}
	else if (!ManagerMotor_IsGoalStateReady(MOTOR_1) && !ManagerMotor_IsGoalStateReady(MOTOR_2) && !ManagerMotor_IsGoalStateReady(MOTOR_3))
	{
		ManagerMovement.autoState = AUTO_STRETCHING;

		exerciseTimer = HAL_GetTick();
		commandSent = false;
	}
}

void ManagerMovement_AutoStrectching()
{
	// Keep the position until time is over
	// Serait la place ou mettre un commande en force

	if (HAL_GetTick() - exerciseTimer >= exercisesTime[exerciseIdx])
	{
		ManagerMovement.autoState = AUTO_2FIRST_POS;
	}
}

void ManagerMovement_Auto2FirstPos()
{
	if (!ManagerMotor_IsGoalStateReady(MOTOR_1) && !ManagerMotor_IsGoalStateReady(MOTOR_2) && !ManagerMotor_IsGoalStateReady(MOTOR_3) && !commandSent)
	{
		ManagerMovement_AutoMovement(exercises[exerciseIdx], (firstPos[exerciseIdx]));
		commandSent = true;
	}
	else if (!ManagerMotor_IsGoalStateReady(MOTOR_1) && !ManagerMotor_IsGoalStateReady(MOTOR_2) && !ManagerMotor_IsGoalStateReady(MOTOR_3))
	{
		ManagerMovement.autoState = IDLE;

		commandSent = false;
		repsCount ++;

		if (repsCount >= repetitions[exerciseIdx])
		{
			exerciseIdx ++;
			repsCount = 0;
		}
	}
}

/*
 * Movements manual
 */
void ManagerMovement_HomingPositions()  // TODO
{
    // Homing en utilisant les limits switch, set origine des moteurs
    // faire chaucn des mouvements jusqua limit switch
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
    if (ManagerMovement.state == MANUAL &&
        !ManagerMotor_IsGoalStateReady(motorIndex))
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

void ManagerMovement_AutoMovement(uint8_t mouvType, float Position)
{
    if (ManagerMovement.state == AUTOMATIC)
    {
        if (mouvType == DORSIFLEXION)  // Set goalPosition for motor 1 and 2 for
                                       // dorsiflexion
        {
            ManagerMovement.motorsNextGoal[MOTOR_1] = Position;
            ManagerMotor_SetMotorGoal(MOTOR_1,
                                      ManagerMovement.motorsNextGoal[MOTOR_1]);
            ManagerMotor_SetMotorGoalState(MOTOR_1, true);

            ManagerMovement.motorsNextGoal[MOTOR_2] = Position;
            ManagerMotor_SetMotorGoal(MOTOR_2,
                                      ManagerMovement.motorsNextGoal[MOTOR_2]);
            ManagerMotor_SetMotorGoalState(MOTOR_2, true);
        }
        else if (mouvType ==
                 EVERSION)  // Set goalPosition for motor 1 and 2 for eversion
        {
            ManagerMovement.motorsNextGoal[MOTOR_1] = -Position;
            ManagerMotor_SetMotorGoal(MOTOR_1,
                                      ManagerMovement.motorsNextGoal[MOTOR_1]);
            ManagerMotor_SetMotorGoalState(MOTOR_1, true);

            ManagerMovement.motorsNextGoal[MOTOR_2] = Position;
            ManagerMotor_SetMotorGoal(MOTOR_2,
                                      ManagerMovement.motorsNextGoal[MOTOR_2]);
            ManagerMotor_SetMotorGoalState(MOTOR_2, true);
        }
        else if (mouvType ==
                 EXTENSION)  // Set goalPosition for motor 3 for extension
        {
            ManagerMovement.motorsNextGoal[MOTOR_3] = Position;
            ManagerMotor_SetMotorGoal(MOTOR_3,
                                      ManagerMovement.motorsNextGoal[MOTOR_3]);
            ManagerMotor_SetMotorGoalState(MOTOR_3, true);
        }
    }
}



