
#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <string.h>

// States
#define MMOV_STATE_IDLE      0
#define MMOV_STATE_WAITING_SECURITY      1
#define MMOV_STATE_HOMING    2
#define MMOV_STATE_MANUAL    3
#define MMOV_STATE_AUTOMATIC 4
#define MMOV_STATE_ERROR 5

// Auto states
#define MMOV_AUTO_STATE_IDLE       0
#define MMOV_AUTO_STATE_2GOAL      1
#define MMOV_AUTO_STATE_STRETCHING 2
#define MMOV_AUTO_STATE_2FIRST_POS 3
#define MMOV_AUTO_STATE_PAUSE      4

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
    float   motorsNextGoal[MMOT_MOTOR_NBR];
    bool reset;

} ManagerMovement_t;

ManagerMovement_t managerMovement;

static const Motor* motorsData[MMOT_MOTOR_NBR];

// Auto setup
uint8_t exerciseIdx;
uint8_t repsCount;

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
bool nextButton;

// Auto mouvements
void ManagerMovement_AutoIdle();
void ManagerMovement_Auto2Goal();
void ManagerMovement_AutoStrectching();
void ManagerMovement_Auto2FirstPos();
void ManagerMovement_AutoPause();

void ManagerMovement_SetFirstPos(uint8_t exerciseIdx);

// Buttons functions
void ManagerMovement_VerifyStopButton();

// Manual functions
void ManagerMovement_HomingPositions();
void ManagerMovement_ManualPositions();
void ManagerMovement_AutoPositions();
void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor);
void ManagerMovement_AutoMovement(uint8_t mouvType, float Position);

bool test;

void ManagerMovement_Init()
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
    nextButton  = false;

    exerciseIdx = 0;
    repsCount   = 0;

    test = true;

    commandSent               = false;
    managerMovement.state     = MMOV_STATE_MANUAL;
    managerMovement.autoState = MMOV_AUTO_STATE_IDLE;
    managerMovement.reset = false;
}

void ManagerMovement_Task()
{
    if (ManagerMotor_IsReady2Move())
    {
        switch (managerMovement.state)
        {

        case MMOV_STATE_IDLE:
			ManagerMovement_Idle();

			break;

        case MMOV_STATE_WAITING_SECURITY:
			ManagerMovement_WaitingSecurity();

			break;

        case MMOV_STATE_HOMING:
            ManagerMovement_HomingPositions();

            break;

        case MMOV_STATE_MANUAL:
            // Wait for manual cmd or for state change

            break;

        case MMOV_STATE_AUTOMATIC:

            ManagerMovement_AutoPositions();
            if (test)
            {
                // Ex1
                ManagerMovement_AddExercise(0, DORSIFLEXION, 3, 5000.0, 3000.0);
                ManagerMovement_SetFinalPos(0, -2);

                // Ex2
                ManagerMovement_AddExercise(1, EXTENSION, 2, 2000.0, 2000.0);
                ManagerMovement_SetFinalPos(1, -1);

                // Ex3
                ManagerMovement_AddExercise(2, EVERSION, 3, 5000.0, 5000.0);
                ManagerMovement_SetFinalPos(2, 3);

                // Start Exs
                ManagerMovement_StartExercise();

                test = false;
            }
            break;

        case MMOV_STATE_ERROR:
            // Wait for manual cmd or for state change

            break;
        }
    }
}

/*
 * Utilities
 */
uint8_t ManagerMovement_GetState()
{
    return managerMovement.state;
}

void ManagerMovement_SetState(uint8_t state)
{
    managerMovement.state = state;
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

void ManagerMovement_ResetExercise()
{
    for (uint8_t i = 0; i < MAX_EXERCISES; i++)
    {
        exercises[i]     = 0;
        repetitions[i]   = 0;
        exercisesTime[i] = 0.0f;
        finalPos[i]      = 0.0f;
        pauseTime[i]     = 0.0f;
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
        managerMovement.autoState = MMOV_AUTO_STATE_IDLE;
    }
}

void ManagerMovement_SetFirstPos(uint8_t exerciseIdx)
{
    if (exercises[exerciseIdx] == DORSIFLEXION ||
        exercises[exerciseIdx] == EVERSION)
    {
        firstPos[exerciseIdx] =
            motorsData[MMOT_MOTOR_1]->position;  // Set first position for exercies
                                            // idx to the initial position
    }
    else if (exercises[exerciseIdx] == EXTENSION)
    {
        firstPos[exerciseIdx] = motorsData[MMOT_MOTOR_3]->position;
    }
}
/*
 * Auto movements
 */
void ManagerMovement_AutoPositions()
{
    // Gerer les sequences d'etirements
    ManagerMovement_VerifyStopButton();

    switch (managerMovement.autoState)
    {
    case MMOV_AUTO_STATE_IDLE:
        ManagerMovement_AutoIdle();

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
    case MMOV_AUTO_STATE_PAUSE:
        ManagerMovement_AutoPause();
    }
}

void ManagerMovement_AutoIdle()
{
    // Waiting for button next and or start

    if (startButton && exercises[exerciseIdx] != 0 &&
        exerciseIdx != MAX_EXERCISES)
    {
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
        managerMovement.autoState = MMOV_AUTO_STATE_PAUSE;

        commandSent = false;
        repsCount++;

        if (repsCount >= repetitions[exerciseIdx])
        {
            exerciseIdx++;
            repsCount = 0;
        }
        pauseTimer = HAL_GetTick();
    }
}

void ManagerMovement_AutoPause()
{
    if (HAL_GetTick() - pauseTimer >= exercisesTime[exerciseIdx])
    {
        managerMovement.autoState = MMOV_STATE_IDLE;
    }
}

/*
 * Movements manual
 */
void ManagerMovement_Idle()  // TODO
{
	// TODO reset movement state machine
}


void ManagerMovement_HomingPositions()  // TODO
{
    // Homing en utilisant les limits switch, set origine des moteurs
    // faire chaucn des mouvements jusqua limit switch
}

void ManagerMovement_ManualCmdEversion(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL)
    {
        ManagerMovement_ManualIncrement(MMOT_MOTOR_1, -1 * direction);
        ManagerMovement_ManualIncrement(MMOT_MOTOR_2, 1 * direction);
    }
}

void ManagerMovement_ManualCmdDorsiflexion(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL)
    {
        ManagerMovement_ManualIncrement(MMOT_MOTOR_1, 1 * direction);
        ManagerMovement_ManualIncrement(MMOT_MOTOR_2, 1 * direction);
    }
}

void ManagerMovement_ManualCmdExtension(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL)
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
    if (managerMovement.state == MMOV_STATE_AUTOMATIC)
    {
        if (mouvType == DORSIFLEXION)  // Set goalPosition for motor 1 and 2 for
                                       // dorsiflexion
        {
            managerMovement.motorsNextGoal[MMOT_MOTOR_1] = Position;
            ManagerMotor_SetMotorGoal(MMOT_MOTOR_1,
                                      managerMovement.motorsNextGoal[MMOT_MOTOR_1]);
            ManagerMotor_SetMotorGoalState(MMOT_MOTOR_1, true);

            managerMovement.motorsNextGoal[MMOT_MOTOR_2] = Position;
            ManagerMotor_SetMotorGoal(MMOT_MOTOR_2,
                                      managerMovement.motorsNextGoal[MMOT_MOTOR_2]);
            ManagerMotor_SetMotorGoalState(MMOT_MOTOR_2, true);
        }
        else if (mouvType ==
                 EVERSION)  // Set goalPosition for motor 1 and 2 for eversion
        {
            managerMovement.motorsNextGoal[MMOT_MOTOR_1] = -Position;
            ManagerMotor_SetMotorGoal(MMOT_MOTOR_1,
                                      managerMovement.motorsNextGoal[MMOT_MOTOR_1]);
            ManagerMotor_SetMotorGoalState(MMOT_MOTOR_1, true);

            managerMovement.motorsNextGoal[MMOT_MOTOR_2] = Position;
            ManagerMotor_SetMotorGoal(MMOT_MOTOR_2,
                                      managerMovement.motorsNextGoal[MMOT_MOTOR_2]);
            ManagerMotor_SetMotorGoalState(MMOT_MOTOR_2, true);
        }
        else if (mouvType ==
                 EXTENSION)  // Set goalPosition for motor 3 for extension
        {
            managerMovement.motorsNextGoal[MMOT_MOTOR_3] = Position;
            ManagerMotor_SetMotorGoal(MMOT_MOTOR_3,
                                      managerMovement.motorsNextGoal[MMOT_MOTOR_3]);
            ManagerMotor_SetMotorGoalState(MMOT_MOTOR_3, true);
        }
    }
}

bool ManagerMovement_WaitingSecPass()
{
	return true;
}

void ManagerMovement_PassSec()
{

}

void ManagerMovement_SetError()
{
	managerMovement.state = MMOV_STATE_ERROR;
}

bool ManagerMovement_InError()
{
	return true;
}

void ManagerMovement_Reset()
{

}

