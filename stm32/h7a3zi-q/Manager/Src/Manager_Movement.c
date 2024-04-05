
#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <Periph_Switch.h>
#include <string.h>

#define GOAL_STEP 0.03

#define MAX_EXERCISES 5

typedef struct
{
    uint8_t state;
    uint8_t autoState;
    uint8_t homingState;

    float motorsNextGoal[MMOT_MOTOR_NBR];
    bool  reset;
    bool  securityPass;

} ManagerMovement_t;

ManagerMovement_t managerMovement;
autoPlanInfo_t    autoPlanInfo;

static const Motor* motorsData[MMOT_MOTOR_NBR];

// Auto setup
uint8_t exerciseIdx;
uint8_t repsCount;

// Limit switch Hit
bool dorUpLimitHit;
bool dorDownLimitHit;
bool evLeftLimitHit;
bool evRightLimitHit;

// Left and right pos for homing
float leftPos;
float rightPos;

uint8_t exercises[MAX_EXERCISES];
uint8_t repetitions[MAX_EXERCISES];
float   exercisesTime[MAX_EXERCISES];
float   pauseTime[MAX_EXERCISES];
float   finalPos[MAX_EXERCISES];
float   firstPos[MAX_EXERCISES];

bool            commandSent;
static uint32_t exerciseTimer = 0;
static uint32_t pauseTimer    = 0;

// Buttons
bool startButton;
bool stopButton;
bool nextButton;

// Task functions
void ManagerMovement_WaitingSecurity();
void ManagerMovement_Homing();
void ManagerMovement_Manual();
void ManagerMovement_Automatic();

// Manual
void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor);

// Auto mouvements
void ManagerMovement_Waiting4Plan();
void ManagerMovement_AutoReady();
void ManagerMovement_Auto2Goal();
void ManagerMovement_AutoStrectching();
void ManagerMovement_Auto2FirstPos();
void ManagerMovement_AutoRest();
void ManagerMovement_AutoStop();

void ManagerMovement_AutoMovement(uint8_t mouvType, float Position);

void ManagerMovement_SetFirstPos(uint8_t exerciseIdx);

// Homing functions
void ManagerMovement_HomingPositions();
void ManagerMovement_HomingExtension();
void ManagerMovement_HomingEversion();
void ManagerMovement_HomingDorsiflexion();
void ManagerMovement_RestPos();

float ManagerMovement_GetMiddlePos(float leftPos, float rightPos);
void  ManagerMovement_SetOrigins(uint8_t motorIndex);

bool test;

void ManagerMovement_Init()
{
    ManagerMovement_Reset();
}

void ManagerMovement_Reset()
{
    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motorsData[i]                     = ManagerMotor_GetMotorData(i);
        managerMovement.motorsNextGoal[i] = 0.0f;
    }

    for (uint8_t i = 0; i < MAX_EXERCISES; i++)
    {
        finalPos[i] = 0.0f;
        firstPos[i] = 0.0f;

        exercises[i]     = 0;
        repetitions[i]   = 0;
        exercisesTime[i] = 0.0f;
        pauseTime[i]     = 0.0f;
    }

    startButton = false;
    stopButton = false;
    nextButton  = false;

    exerciseIdx = 0;
    repsCount   = 0;

    test = true;

    commandSent                  = false;
    managerMovement.reset        = false;
    managerMovement.securityPass = false;

    managerMovement.state       = MMOV_STATE_WAITING_SECURITY;
    managerMovement.autoState   = MMOV_AUTO_STATE_WAITING4PLAN;
    managerMovement.homingState = MMOV_HOMING_EXTENSION;
}

void ManagerMovement_Task()
{
    if (ManagerMotor_IsReady2Move())
    {
        switch (managerMovement.state)
        {
        case MMOV_STATE_WAITING_SECURITY:
            ManagerMovement_WaitingSecurity();
            break;

        case MMOV_STATE_HOMING:
            ManagerMovement_Homing();
            break;

        case MMOV_STATE_MANUAL:
            ManagerMovement_Manual();
            break;

        case MMOV_STATE_AUTOMATIC:
            ManagerMovement_Automatic();

            break;

        case MMOV_STATE_ERROR:
            // Wait for manual cmd or for state change

            break;
        }
    }
}

/*
 * Task functions
 */

void ManagerMovement_WaitingSecurity()
{
    if (managerMovement.securityPass)
    {
        managerMovement.state = MMOV_STATE_HOMING;
    }
}

void ManagerMovement_Manual()  // TODO
{
    // conditions pour changer d'état ici
}

void ManagerMovement_Homing()
{
    switch (managerMovement.homingState)
    {
    case MMOV_VERIF_PERSON_IN:

        break;

    case MMOV_HOMING_EXTENSION:
        ManagerMovement_HomingExtension();

        break;

    case MMOV_HOMING_EVERSION:
        ManagerMovement_HomingEversion();

        break;

    case MMOV_HOMING_DORSIFLEXION:
        ManagerMovement_HomingDorsiflexion();

        break;

    case MMOV_REST_POS:
        ManagerMovement_RestPos();
        break;
    }
}

void ManagerMovement_Automatic()
{
    // Gerer les sequences d'etirements
    switch (managerMovement.autoState)
    {
    case MMOV_AUTO_STATE_WAITING4PLAN:
    	ManagerMovement_Waiting4Plan();
    	break;

    case MMOV_AUTO_STATE_READY:
        ManagerMovement_AutoReady();

        break;

    case MMOV_AUTO_STATE_2GOAL:
        ManagerMovement_Auto2Goal();

        break;

    case MMOV_AUTO_STATE_STRETCHING:
        ManagerMovement_AutoStrectching();

        break;

    case MMOV_AUTO_STATE_2FIRST_POS:
        ManagerMovement_Auto2FirstPos();

        break;
    case MMOV_AUTO_STATE_REST:
        ManagerMovement_AutoRest();

        break;

    case MMOV_AUTO_STATE_STOP:
    	ManagerMovement_AutoStop();

    	break;
    }
}

/*
 * Security commands
 */
bool ManagerMovement_IsWaitingSecurity()
{
    if (managerMovement.state == MMOV_STATE_WAITING_SECURITY)
    {
        return true;
    }
    return false;
}

void ManagerMovement_SecurityPassed()
{
    managerMovement.securityPass = true;
}

void ManagerMovement_SetError()
{
    managerMovement.state = MMOV_STATE_ERROR;
}

bool ManagerMovement_InError()
{
    if (managerMovement.state == MMOV_STATE_ERROR)
    {
        return true;
    }
    return false;
}

/*
 * Manual commands
 */
void ManagerMovement_ManualCmdEversion(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL ||
        managerMovement.state == MMOV_STATE_HOMING)
    {
        ManagerMovement_ManualIncrement(MMOT_MOTOR_1, 1 * direction);
        ManagerMovement_ManualIncrement(MMOT_MOTOR_2, 1 * direction);
    }
}

void ManagerMovement_ManualCmdDorsiflexion(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL ||
        managerMovement.state == MMOV_STATE_HOMING)
    {
        ManagerMovement_ManualIncrement(MMOT_MOTOR_1, -1 * direction);
        ManagerMovement_ManualIncrement(MMOT_MOTOR_2, 1 * direction);
    }
}

void ManagerMovement_ManualCmdExtension(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL ||
        managerMovement.state == MMOV_STATE_HOMING)
    {
        ManagerMovement_ManualIncrement(MMOT_MOTOR_3, 1 * direction);
    }
}

void ManagerMovement_ManualCmdHome(uint8_t motorIndex)
{
    if (managerMovement.state == MMOV_STATE_MANUAL &&
        !ManagerMotor_IsGoalStateReady(motorIndex))
    {
        managerMovement.motorsNextGoal[motorIndex] = 0.0;
        ManagerMotor_SetMotorGoal(motorIndex,
                                  managerMovement.motorsNextGoal[motorIndex]);
        ManagerMotor_SetMotorGoalState(motorIndex, true);
    }
}

void ManagerMovement_ManualCmdHomeAll()
{
    ManagerMovement_ManualCmdHome(MMOT_MOTOR_1);
    ManagerMovement_ManualCmdHome(MMOT_MOTOR_2);
    ManagerMovement_ManualCmdHome(MMOT_MOTOR_3);
}

void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor)
{
    // motor is ready when nextPos has been reached
    if (!ManagerMotor_IsGoalStateReady(motorIndex))
    {
        managerMovement.motorsNextGoal[motorIndex] =
            motorsData[motorIndex]->position + factor * GOAL_STEP;
        ManagerMotor_SetMotorGoal(motorIndex,
                                  managerMovement.motorsNextGoal[motorIndex]);
        ManagerMotor_SetMotorGoalState(motorIndex, true);
    }

    // Else : do nothing so skip command to avoid an accumulation of
    // incrementation
}

void ManagerMovement_AutoMovement(uint8_t mouvType, float Position)
{
    float deltaPos = Position - motorsData[MMOT_MOTOR_2]->position;

    if (mouvType == MMOV_EVERSION)  // Set goalPosition for motor 1 and 2 for
                               // MMOV_DORSIFLEXION
    {
        managerMovement.motorsNextGoal[MMOT_MOTOR_2] = Position;
        ManagerMotor_SetMotorGoal(MMOT_MOTOR_2,
                                  managerMovement.motorsNextGoal[MMOT_MOTOR_2]);
        ManagerMotor_SetMotorGoalState(MMOT_MOTOR_2, true);

        managerMovement.motorsNextGoal[MMOT_MOTOR_1] =
            motorsData[MMOT_MOTOR_1]->position + deltaPos;
        ManagerMotor_SetMotorGoal(MMOT_MOTOR_1,
                                  managerMovement.motorsNextGoal[MMOT_MOTOR_1]);
        ManagerMotor_SetMotorGoalState(MMOT_MOTOR_1, true);
    }
    else if (mouvType ==
             MMOV_DORSIFLEXION)  // Set goalPosition for motor 1 and 2 for MMOV_EVERSION
    {
        managerMovement.motorsNextGoal[MMOT_MOTOR_2] = Position;
        ManagerMotor_SetMotorGoal(MMOT_MOTOR_2,
                                  managerMovement.motorsNextGoal[MMOT_MOTOR_2]);
        ManagerMotor_SetMotorGoalState(MMOT_MOTOR_2, true);

        managerMovement.motorsNextGoal[MMOT_MOTOR_1] =
            motorsData[MMOT_MOTOR_1]->position - deltaPos;
        ManagerMotor_SetMotorGoal(MMOT_MOTOR_1,
                                  managerMovement.motorsNextGoal[MMOT_MOTOR_1]);
        ManagerMotor_SetMotorGoalState(MMOT_MOTOR_1, true);
    }
    else if (mouvType ==
             MMOV_EXTENSION)  // Set goalPosition for motor 3 for MMOV_EXTENSION
    {
        managerMovement.motorsNextGoal[MMOT_MOTOR_3] = Position;
        ManagerMotor_SetMotorGoal(MMOT_MOTOR_3,
                                  managerMovement.motorsNextGoal[MMOT_MOTOR_3]);
        ManagerMotor_SetMotorGoalState(MMOT_MOTOR_3, true);
    }
}

/*
 * Auto setup
 */
void ManagerMovement_AddExercise(uint8_t exerciseIdx, uint8_t exerciseType,
                                 uint8_t reps, float eTime, float pTime)
{
    exercises[exerciseIdx]     = exerciseType;
    repetitions[exerciseIdx]   = reps;
    exercisesTime[exerciseIdx] = eTime;
    pauseTime[exerciseIdx]     = pTime;
}

bool ManagerMovement_ResetExercise()
{
	bool reset = false;
	if (managerMovement.autoState == MMOV_AUTO_STATE_READY)
	{
		for (uint8_t i = 0; i < MAX_EXERCISES; i++)
		{
			exercises[i]     = 0;
			repetitions[i]   = 0;
			exercisesTime[i] = 0.0f;
			finalPos[i]      = 0.0f;
			pauseTime[i]     = 0.0f;
		}
		managerMovement.autoState = MMOV_AUTO_STATE_WAITING4PLAN;
		reset = true;
	}
	return reset;
}

void ManagerMovement_SetFinalPos(uint8_t exerciseIdx, float finalPosition)
{
    finalPos[exerciseIdx] = finalPosition;
}

void ManagerMovement_StartExercise()
{
    startButton = true;
}

void ManagerMovement_PauseExercise()
{
	startButton = false;
}

void ManagerMovement_StopExercise()
{
    stopButton = true;
}

void ManagerMovement_NextExercise()
{
    nextButton = true;
}

void ManagerMovement_SetFirstPos(uint8_t exerciseIdx)
{
    if (exercises[exerciseIdx] == MMOV_DORSIFLEXION ||
        exercises[exerciseIdx] == MMOV_EVERSION)
    {
        firstPos[exerciseIdx] =
            motorsData[MMOT_MOTOR_1]
                ->position;  // Set first position for exercies
                             // idx to the initial position
    }
    else if (exercises[exerciseIdx] == MMOV_EXTENSION)
    {
        firstPos[exerciseIdx] = motorsData[MMOT_MOTOR_3]->position;
    }
}

/*
 * Auto movements
 */
void ManagerMovement_Waiting4Plan()
{
	if (exercises[0] != 0)
	{
		managerMovement.autoState = MMOV_AUTO_STATE_READY;
	}
}

void ManagerMovement_AutoReady()
{
    // Waiting for button next and or start
	if (exercises[exerciseIdx] == 0 || exerciseIdx == MAX_EXERCISES)
	{
		managerMovement.autoState = MMOV_AUTO_STATE_STOP;
	}
	else
	{
		if (startButton)
		{
			if (repsCount >= repetitions[exerciseIdx])
			{
				exerciseIdx++;
				repsCount = 0;
			}

			// Set the position that the exercise is starting
			if (repsCount == 0)
			{
				ManagerMovement_SetFirstPos(exerciseIdx);
			}

			if (nextButton || exerciseIdx == 0 || repsCount != 0)
			{
				managerMovement.autoState = MMOV_AUTO_STATE_2GOAL;
				nextButton                = false;
			}
		}
	}
}

void ManagerMovement_Auto2Goal()
{
    if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
        !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
        !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3) && !commandSent)
    {
        ManagerMovement_AutoMovement(exercises[exerciseIdx],
                                     finalPos[exerciseIdx]);
        commandSent = true;
    }
    else if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
             !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
             !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3))
    {
    	managerMovement.autoState = MMOV_AUTO_STATE_STRETCHING;
		exerciseTimer = HAL_GetTick();
		commandSent   = false;
    }
}

void ManagerMovement_AutoStrectching()
{
    // Keep the position until time is over
    // Serait la place ou mettre un commande en force

    if (HAL_GetTick() - exerciseTimer >= exercisesTime[exerciseIdx])
    {
        managerMovement.autoState = MMOV_AUTO_STATE_2FIRST_POS;
    }
}

void ManagerMovement_Auto2FirstPos()
{
    if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
        !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
        !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3) && !commandSent)
    {
        ManagerMovement_AutoMovement(exercises[exerciseIdx],
                                     (firstPos[exerciseIdx]));
        commandSent = true;
    }
    else if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
             !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
             !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3))
    {
        managerMovement.autoState = MMOV_AUTO_STATE_REST;

        commandSent = false;
        pauseTimer = HAL_GetTick();
    }
}

void ManagerMovement_AutoRest()
{
    if (HAL_GetTick() - pauseTimer >= exercisesTime[exerciseIdx])
    {
        managerMovement.autoState = MMOV_AUTO_STATE_READY;
        repsCount++;
    }

    if (stopButton || !startButton)
	{
		managerMovement.autoState = MMOV_AUTO_STATE_STOP;
	}
}

void ManagerMovement_AutoStop()
{
	//go to first pos
	if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
		!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
		!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3) && !commandSent)
	{
		ManagerMovement_AutoMovement(exercises[exerciseIdx],
									 (firstPos[exerciseIdx]));
		commandSent = true;
	}
	else if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
			 !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
			 !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3))
	{
		if(startButton || stopButton)
		{
			exerciseIdx = 0;
			repsCount = 0;
		}

		managerMovement.autoState = MMOV_AUTO_STATE_READY;
		commandSent = false;
		stopButton = false;
		startButton = false;
	}
}

/*
 * Homing
 */
void ManagerMovement_HomingExtension()
{
    // Increment until limitswitch

    if (PeriphSwitch_ExtensionUp())
    {
        managerMovement.homingState = MMOV_HOMING_EVERSION;
        // ManagerMovement_SetOrigins(MMOT_MOTOR_3);
    }
    else
    {
        ManagerMovement_ManualCmdExtension(MMOV_UP);
    }
}

void ManagerMovement_HomingEversion()
{
    // Increment until limitswitch
    if (PeriphSwitch_EversionLeft() || evLeftLimitHit)
    {
        if (!evLeftLimitHit)
        {
            leftPos        = motorsData[MMOT_MOTOR_2]->position;
            evLeftLimitHit = true;
        }

        if (PeriphSwitch_EversionRight() || evRightLimitHit)
        {
            if (!evRightLimitHit)
            {
                rightPos        = motorsData[MMOT_MOTOR_2]->position;
                evRightLimitHit = true;
            }

            if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
                !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) && !commandSent)
            {
                ManagerMovement_AutoMovement(
                    MMOV_EVERSION, ManagerMovement_GetMiddlePos(leftPos, rightPos));

                commandSent = true;
            }
            else if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
                     !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2))
            {
                evLeftLimitHit  = false;
                evRightLimitHit = false;
                commandSent     = false;

                managerMovement.homingState = MMOV_HOMING_DORSIFLEXION;
            }
        }
        else
        {
            ManagerMovement_ManualCmdEversion(MMOV_RIGTH);
        }
    }
    else
    {
        ManagerMovement_ManualCmdEversion(MMOV_LEFT);
    }
}

void ManagerMovement_HomingDorsiflexion()
{
    // Increment until limitswitch
    if (PeriphSwitch_DorsiflexionUp() || dorUpLimitHit)
    {
        if (!dorUpLimitHit)
        {
            leftPos       = motorsData[MMOT_MOTOR_2]->position;
            dorUpLimitHit = true;
        }

        if (PeriphSwitch_DorsiflexionDown() || dorDownLimitHit)
        {
            if (!dorDownLimitHit)
            {
                rightPos        = motorsData[MMOT_MOTOR_2]->position;
                dorDownLimitHit = true;
            }

            if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
                !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) && !commandSent)
            {
                ManagerMovement_AutoMovement(
                    MMOV_DORSIFLEXION,
                    ManagerMovement_GetMiddlePos(leftPos, rightPos));

                commandSent = true;
            }
            else if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
                     !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2))
            {
                //				ManagerMovement_SetOrigins(MMOT_MOTOR_1);
                //				ManagerMovement_SetOrigins(MMOT_MOTOR_2);

                dorUpLimitHit   = false;
                dorDownLimitHit = false;
                commandSent     = false;

                managerMovement.homingState = MMOV_REST_POS;
            }
        }
        else
        {
            ManagerMovement_ManualCmdDorsiflexion(MMOV_DOWN);
        }
    }
    else
    {
        ManagerMovement_ManualCmdDorsiflexion(MMOV_UP);
    }
}

void ManagerMovement_RestPos()
{
    if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3) && !commandSent)
    {
        ManagerMovement_AutoMovement(MMOV_EXTENSION, MMOV_REST_POS);

        commandSent = true;
    }
    else if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3))
    {
        commandSent = false;

        managerMovement.homingState = MMOV_VERIF_PERSON_IN;
        managerMovement.state       = MMOV_STATE_MANUAL;
    }
}

float ManagerMovement_GetMiddlePos(float leftPos, float rightPos)
{
    float middlePos = (leftPos + rightPos) / 2.0;

    return middlePos;
}

void ManagerMovement_SetOrigins(uint8_t motorIndex)
{
    ManagerMotor_SetOriginShift(motorIndex, motorsData[motorIndex]->position);
    ManagerMotor_SetMotorGoal(motorIndex, 0.0);

    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        managerMovement.motorsNextGoal[i] = 0.0f;
    }
}

/*
 * Utilities
 */
autoPlanInfo_t* ManagerMovement_GetPlanData()
{
    // Copy the infos
    autoPlanInfo.autoState = managerMovement.autoState;
    autoPlanInfo.homingState = managerMovement.homingState;
    autoPlanInfo.repsCount = repsCount;
    autoPlanInfo.exCount   = exerciseIdx;

    // return the struct's address
    return &autoPlanInfo;
}

uint8_t ManagerMovement_GetState()
{
    return managerMovement.state;
}
