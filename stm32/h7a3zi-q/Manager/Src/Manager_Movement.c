
#include <Manager_Error.h>
#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <Periph_Switch.h>
#include <Periph_UartRingBuf.h>
#include <string.h>

#define MMOV_REST_POS -1

#define MAX_EXERCISES 10
#define MAX_MOVEMENT  3
#define EXTREME_POS   4

#define MANUAL_MAX_TRANSMIT_TIME 200  // ms

#define MMOV_CHANGESIDE_STATE_WAITING4CMD 0
#define MMOV_CHANGESIDE_STATE_MOVERIGHT   1
#define MMOV_CHANGESIDE_STATE_MOVELEFT    2

typedef struct
{
    uint8_t state;
    uint8_t autoState;
    uint8_t changeSideState;
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
uint8_t movementIdx;
uint8_t repsCount;

bool pos1Reached;
bool pos2Reached;
bool pos3Reached;

// Limit switch Hit
bool dorUpLimitHit;
bool dorDownLimitHit;
bool evInsideLimitHit;
bool evOutsideLimitHit;
bool exUpLimitHit;

bool buttonStartReset;

// Left and right pos for homing
float leftPos;
float rightPos;

uint8_t movements[MAX_EXERCISES];
uint8_t repetitions[MAX_EXERCISES];
uint8_t mvtNbr[MAX_EXERCISES];
float   exercisesTime[MAX_EXERCISES];
float   pauseTime[MAX_EXERCISES];
float   finalPos[MAX_EXERCISES];
float   firstPos[MAX_MOVEMENT];

bool            commandSent;
static uint32_t exerciseTimer = 0;
static uint32_t pauseTimer    = 0;

// Buttons
bool startButton;
bool stopButton;

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

// Change side
void ManagerMovement_ChangeSide();
void ManagerMovement_Waiting4Cmd();
void ManagerMovement_ChangeSideRight();
void ManagerMovement_ChangeSideLeft();

bool ManagerMovement_InsideLimitSwitch();
bool ManagerMovement_OutsideLimitSwitch();

// Homing functions
void ManagerMovement_HomingPositions();
void ManagerMovement_HomingExtension();
void ManagerMovement_HomingEversion();
void ManagerMovement_HomingDorsiflexion();
void ManagerMovement_RestPos();

// General movement functions
bool  ManagerMovement_GoToPos(uint8_t exerciseId, float pos);
void  ManagerMovement_AutoMovement(uint8_t mouvType, float Position);
void  ManagerMovement_SetFirstPos(uint8_t exerciseIdx);
float ManagerMovement_GetMiddlePos(float leftPos, float rightPos);
void  ManagerMovement_SetOrigins(uint8_t motorIndex);

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

        firstPos[i] = 0.0f;
    }

    // Init exercises tables
    for (uint8_t i = 0; i < MAX_EXERCISES; i++)
    {
        finalPos[i] = 0.0f;

        repetitions[i]   = 0;
        mvtNbr[i]        = 0;
        exercisesTime[i] = 0.0f;
        pauseTime[i]     = 0.0f;
    }

    // Init Auto counters and buttons
    startButton = false;
    stopButton  = false;

    exerciseIdx = 0;
    movementIdx = 0;
    repsCount   = 0;

    commandSent      = false;
    buttonStartReset = false;

    pos1Reached = false;
    pos2Reached = false;
    pos3Reached = false;

    // Init modes' states
    managerMovement.reset        = false;
    managerMovement.securityPass = false;

    managerMovement.state           = MMOV_STATE_WAITING_SECURITY;
    managerMovement.autoState       = MMOV_AUTO_STATE_WAITING4PLAN;
    managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_WAITING4CMD;
    managerMovement.homingState     = MMOV_HOMING_EXTENSION;
}

void ManagerMovement_Task()
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

    case MMOV_STATE_CHANGESIDE:
        ManagerMovement_ChangeSide();

    case MMOV_STATE_ERROR:

        break;
    }
}

/*
 * Task functions
 */

void ManagerMovement_WaitingSecurity()
{
    if (managerMovement.securityPass)
    {
        managerMovement.state = MMOV_STATE_MANUAL;
    }
}

void ManagerMovement_Manual()
{
    if (PeriphUartRingBuf_GetRxTimerDelay() > MANUAL_MAX_TRANSMIT_TIME)
    {
        ManagerMotor_StopManualMovement(MMOT_MOTOR_1);
        ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
        ManagerMotor_StopManualMovement(MMOT_MOTOR_3);
    }
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

    case MMOV_HOMING_REST_POS:
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

void ManagerMovement_ChangeSide()
{
    switch (managerMovement.changeSideState)
    {
    case MMOV_CHANGESIDE_STATE_WAITING4CMD:
        ManagerMovement_Waiting4Cmd();

        break;

    case MMOV_CHANGESIDE_STATE_MOVERIGHT:
        ManagerMovement_ChangeSideRight();

        break;

    case MMOV_CHANGESIDE_STATE_MOVELEFT:
        ManagerMovement_ChangeSideLeft();

        break;
    }
}

void ManagerMovement_Waiting4Cmd()
{
    if (PeriphSwitch_LegLeft())
    {
        managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_MOVERIGHT;
    }
    else if (PeriphSwitch_LegRight())
    {
        managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_MOVELEFT;
    }
}

void ManagerMovement_ChangeSideRight()
{
    // UNLOCK le soleinoids qui bloque le mouvement

    if (PeriphSwitch_LegRight())
    {
        ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
        // LOCK le soleinoid pour bloquer le mouvement
        // UNLOCK le soleinoid dans l'eversion

        ManagerMovement_HomingEversion();
    }
    else
    {
        ManagerMovement_ManualCmdEversion(MMOV_INSIDE);
    }
}

void ManagerMovement_ChangeSideLeft()
{
    // UNLOCK le soleinoids qui bloque le mouvement

    if (PeriphSwitch_LegLeft())
    {
        ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
        // LOCK le soleinoid pour bloquer le mouvement
        // UNLOCK le soleinoid dans l'eversion

        ManagerMovement_HomingEversion();
    }
    else
    {
        ManagerMovement_ManualCmdEversion(MMOV_INSIDE);
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
        managerMovement.state == MMOV_STATE_HOMING ||
        managerMovement.state == MMOV_STATE_CHANGESIDE)
    {
        if (PeriphSwitch_LegLeft())
        {
            ManagerMovement_ManualIncrement(MMOT_MOTOR_2, -direction);
        }
        else if (PeriphSwitch_LegRight())
        {
            ManagerMovement_ManualIncrement(MMOT_MOTOR_2, direction);
        }
    }
}

void ManagerMovement_ManualCmdDorsiflexion(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL ||
        managerMovement.state == MMOV_STATE_HOMING)
    {
        ManagerMovement_ManualIncrement(MMOT_MOTOR_1, direction);
    }
}

void ManagerMovement_ManualCmdExtension(int8_t direction)
{
    if (managerMovement.state == MMOV_STATE_MANUAL ||
        managerMovement.state == MMOV_STATE_HOMING)
    {
        ManagerMovement_ManualIncrement(MMOT_MOTOR_3, direction);
    }
}

void ManagerMovement_ManualIncrement(uint8_t motorIndex, int8_t factor)
{
    // motor is ready when nextPos has been reached
    if (!ManagerMotor_IsGoalStateReady(motorIndex))
    {
        managerMovement.motorsNextGoal[motorIndex] = factor * EXTREME_POS;
        ManagerMotor_MovePosOld(motorIndex,
                                managerMovement.motorsNextGoal[motorIndex]);
    }

    // Else : do nothing so skip command to avoid an accumulation of
    // incrementation
}

void ManagerMovement_AutoMovement(uint8_t mouvType, float Position)
{
    if (mouvType == MMOV_DORSIFLEXION)  // Set goalPosition for motor 1 for
                                        // MMOV_DORSIFLEXION
    {
        managerMovement.motorsNextGoal[MMOT_MOTOR_1] =
            -Position;  // Motor is inverse
        ManagerMotor_MovePosOld(MMOT_MOTOR_1,
                                managerMovement.motorsNextGoal[MMOT_MOTOR_1]);
    }
    else if (mouvType == MMOV_EVERSION)  // Set goalPosition for motor 2 and
                                         // for MMOV_EVERSION
    {
        if (PeriphSwitch_LegLeft())
        {
            managerMovement.motorsNextGoal[MMOT_MOTOR_2] = -Position;
        }
        else if (PeriphSwitch_LegRight())
        {
            managerMovement.motorsNextGoal[MMOT_MOTOR_2] = Position;
        }
        ManagerMotor_MovePosOld(MMOT_MOTOR_2,
                                managerMovement.motorsNextGoal[MMOT_MOTOR_2]);
    }
    else if (mouvType ==
             MMOV_EXTENSION)  // Set goalPosition for motor 3 for MMOV_EXTENSION
    {
        managerMovement.motorsNextGoal[MMOT_MOTOR_3] = Position;
        ManagerMotor_MovePosOld(MMOT_MOTOR_3,
                                managerMovement.motorsNextGoal[MMOT_MOTOR_3]);
    }
}

/*
 * Auto setup
 */
void ManagerMovement_AddExerciseInfo(uint8_t exerciseIdx, uint8_t moveNbr,
                                     uint8_t reps, float eTime, float pTime)
{
    mvtNbr[exerciseIdx]        = moveNbr;
    repetitions[exerciseIdx]   = reps;
    exercisesTime[exerciseIdx] = eTime;
    pauseTime[exerciseIdx]     = pTime;
}

void ManagerMovement_AddMouvement(uint8_t mvtIdx, uint8_t movementType,
                                  float finalPosition)
{
    movements[mvtIdx] = movementType;
    finalPos[mvtIdx]  = finalPosition;
}

void ManagerMovement_ResetExercise()
{
    for (uint8_t i = 0; i < MAX_EXERCISES; i++)
    {
        repetitions[i]   = 0;
        exercisesTime[i] = 0.0f;
        finalPos[i]      = 0.0f;
        pauseTime[i]     = 0.0f;
        movements[i]     = 0.0f;
        mvtNbr[i]        = 0.0f;
    }
    managerMovement.autoState = MMOV_AUTO_STATE_WAITING4PLAN;
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

void ManagerMovement_SetFirstPos(uint8_t mvtNbr)
{
    // Sets an array of the first position of each movements for all the reps,
    // so the array has max 3 values and is overwritten each sets
    for (uint8_t i = 0; i < mvtNbr; i++)
    {
        if (movements[i + movementIdx] == MMOV_DORSIFLEXION ||
            movements[i + movementIdx] == MMOV_EVERSION)
        {
            firstPos[i] = motorsData[MMOT_MOTOR_1]->position;
        }
        else if (movements[i + movementIdx] == MMOV_EXTENSION)
        {
            firstPos[i] = motorsData[MMOT_MOTOR_3]->position;
        }
    }
}

/*
 * Auto movements
 */
void ManagerMovement_Waiting4Plan()
{
    if (movements[0] != 0)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_READY;
    }
}

void ManagerMovement_AutoReady()
{
    // Verify if the plan as good values
    if (mvtNbr[exerciseIdx] == 0 || exerciseIdx == MAX_EXERCISES)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_STOP;
    }
    else
    {
        // Stops the start cmd if reps are over
        if (repsCount >= repetitions[exerciseIdx] && !buttonStartReset)
        {
            startButton = false;
            movementIdx += mvtNbr[exerciseIdx];

            buttonStartReset = true;
        }
        // Waiting for button Start on HMI
        if (startButton)
        {
            if (repsCount >= repetitions[exerciseIdx])
            {
                repsCount = 0;
                exerciseIdx++;
            }

            if (repsCount == 0)
            {
                // Set the position that the exercise is starting
                ManagerMovement_SetFirstPos(mvtNbr[exerciseIdx]);
            }
            buttonStartReset          = false;
            managerMovement.autoState = MMOV_AUTO_STATE_2GOAL;
        }
    }
}

void ManagerMovement_Auto2Goal()
{
    /* The machine executes the series of mvtNbr movement for the specified
     * exercises. Depending on the mvtNbr, one, two or three movement can be
     * executed. Once the positions are reached, movementIdx is decremented to
     * the last movement done, the flags are reset, and the state is changed.
     */

    if (!pos1Reached && mvtNbr[exerciseIdx] >= 1)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx],
                                    finalPos[movementIdx]))
        {
            pos1Reached = true;
            movementIdx++;
        }
    }
    else if (!pos2Reached && mvtNbr[exerciseIdx] >= 2)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx],
                                    finalPos[movementIdx]))
        {
            pos2Reached = true;
            movementIdx++;
        }
    }
    else if (!pos3Reached && mvtNbr[exerciseIdx] >= 3)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx],
                                    finalPos[movementIdx]))
        {
            pos3Reached = true;
            movementIdx++;
        }
    }
    else
    {
        managerMovement.autoState = MMOV_AUTO_STATE_STRETCHING;
        exerciseTimer             = HAL_GetTick();

        pos1Reached = false;
        pos2Reached = false;
        pos3Reached = false;

        movementIdx--;
    }
}

void ManagerMovement_AutoStrectching()
{
    // Keep the position until time is over
    // Serait la place ou mettre un commande en force
    if (stopButton || !startButton)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_STOP;
    }
    else if (HAL_GetTick() - exerciseTimer >= exercisesTime[exerciseIdx])
    {
        managerMovement.autoState = MMOV_AUTO_STATE_2FIRST_POS;
    }
}

void ManagerMovement_Auto2FirstPos()
{
    /* The machine executes the same series of position, but in reverse and
     * going back to the firstPos. Once the positions are reached, movementIdx
     * is incremented to the last movement done, the flags are reset, and the
     * state is changed.
     */
    if (!pos3Reached && mvtNbr[exerciseIdx] >= 3)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx], firstPos[2]))
        {
            pos3Reached = true;
            movementIdx--;
        }
    }
    else if (!pos2Reached && mvtNbr[exerciseIdx] >= 2)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx], firstPos[1]))
        {
            pos2Reached = true;
            movementIdx--;
        }
    }
    else if (!pos1Reached && mvtNbr[exerciseIdx] >= 1)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx], firstPos[0]))
        {
            pos1Reached = true;
            movementIdx--;
        }
    }
    else
    {
        managerMovement.autoState = MMOV_AUTO_STATE_REST;
        pauseTimer                = HAL_GetTick();

        pos1Reached = false;
        pos2Reached = false;
        pos3Reached = false;

        movementIdx++;
    }
}

void ManagerMovement_AutoRest()
{
    if (stopButton || !startButton)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_STOP;
    }
    else if (HAL_GetTick() - pauseTimer >= exercisesTime[exerciseIdx])
    {
        managerMovement.autoState = MMOV_AUTO_STATE_READY;
        repsCount++;
    }
}

void ManagerMovement_AutoStop()
{
    // Go to first pos
    if (!pos3Reached && mvtNbr[exerciseIdx] >= 3)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx], firstPos[2]))
        {
            pos3Reached = true;
            movementIdx--;
        }
    }
    else if (!pos2Reached && mvtNbr[exerciseIdx] >= 2)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx], firstPos[1]))
        {
            pos2Reached = true;
            movementIdx--;
        }
    }
    else if (!pos1Reached && mvtNbr[exerciseIdx] >= 1)
    {
        if (ManagerMovement_GoToPos(movements[movementIdx], firstPos[0]))
        {
            pos1Reached = true;
            movementIdx--;
        }
    }
    else
    {
        // Resets everything like in Auto2FirstPos()
        movementIdx++;

        pos1Reached = false;
        pos2Reached = false;
        pos3Reached = false;

        // Reset the counter if exercises are done or if stop command on the HMI
        if (mvtNbr[exerciseIdx] == 0 || stopButton)
        {
            exerciseIdx = 0;
            movementIdx = 0;
            repsCount   = 0;
        }

        managerMovement.autoState = MMOV_AUTO_STATE_READY;
        stopButton                = false;
        startButton               = false;
    }
}

/*
 * Homing
 */
void ManagerMovement_HomingExtension()
{
    // Increment until limitswitch

    if (PeriphSwitch_ExtensionUp() || exUpLimitHit)
    {
        ManagerMotor_StopManualMovement(MMOT_MOTOR_3);
        if (!exUpLimitHit)
        {
            exUpLimitHit = true;
        }

        if (!PeriphSwitch_ExtensionUp())
        {
            ManagerMotor_StopManualMovement(MMOT_MOTOR_3);

            managerMovement.homingState = MMOV_HOMING_EVERSION;
            exUpLimitHit                = false;
            ManagerMovement_SetOrigins(MMOT_MOTOR_3);
        }
        else
        {
            ManagerMovement_ManualCmdExtension(MMOV_DOWN);
        }
    }
    else
    {
        ManagerMovement_ManualCmdExtension(MMOV_UP);
    }
}

void ManagerMovement_HomingEversion()
{
    // Increment until limitswitch
    if (ManagerMovement_InsideLimitSwitch() || evInsideLimitHit)
    {
        ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
        if (!evInsideLimitHit)
        {
            leftPos          = motorsData[MMOT_MOTOR_2]->position;
            evInsideLimitHit = true;
        }

        if (ManagerMovement_OutsideLimitSwitch() || evOutsideLimitHit)
        {
            ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
            if (!evOutsideLimitHit)
            {
                rightPos          = motorsData[MMOT_MOTOR_2]->position;
                evOutsideLimitHit = true;
            }

            if (ManagerMovement_GoToPos(
                    MMOV_EVERSION,
                    ManagerMovement_GetMiddlePos(leftPos, rightPos)))
            {
                ManagerMovement_SetOrigins(MMOT_MOTOR_2);

                evInsideLimitHit  = false;
                evOutsideLimitHit = false;

                if (managerMovement.state == MMOV_STATE_CHANGESIDE)
                {
                    managerMovement.changeSideState =
                        MMOV_CHANGESIDE_STATE_WAITING4CMD;
                    managerMovement.state = MMOV_STATE_AUTOMATIC;
                }
                else
                {
                    managerMovement.homingState = MMOV_HOMING_DORSIFLEXION;
                }
            }
        }
        else
        {
            ManagerMovement_ManualCmdEversion(MMOV_OUTSIDE);
        }
    }
    else
    {
        ManagerMovement_ManualCmdEversion(MMOV_INSIDE);
    }
}

void ManagerMovement_HomingDorsiflexion()
{
    // Increment until limitswitch
    if (PeriphSwitch_DorsiflexionUp() || dorUpLimitHit)
    {
        ManagerMotor_StopManualMovement(MMOT_MOTOR_1);
        if (!dorUpLimitHit)
        {
            leftPos       = motorsData[MMOT_MOTOR_1]->position;
            dorUpLimitHit = true;
        }

        if (PeriphSwitch_DorsiflexionDown() || dorDownLimitHit)
        {
            ManagerMotor_StopManualMovement(MMOT_MOTOR_1);
            if (!dorDownLimitHit)
            {
                rightPos        = motorsData[MMOT_MOTOR_1]->position;
                dorDownLimitHit = true;
            }

            if (ManagerMovement_GoToPos(
                    MMOV_DORSIFLEXION,
                    ManagerMovement_GetMiddlePos(leftPos, rightPos)))
            {
                ManagerMovement_SetOrigins(MMOT_MOTOR_1);

                dorUpLimitHit   = false;
                dorDownLimitHit = false;

                managerMovement.homingState = MMOV_HOMING_REST_POS;
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
    if (ManagerMovement_GoToPos(MMOV_EXTENSION, MMOV_REST_POS))
    {
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
    ManagerMotor_MovePosOld(motorIndex, 0.0f);
    managerMovement.motorsNextGoal[motorIndex] = 0.0f;
}

bool ManagerMovement_GoToPos(uint8_t exerciseId, float pos)
{
    bool posReached = false;

    if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
        !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
        !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3) && !commandSent)
    {
        ManagerMovement_AutoMovement(exerciseId, pos);
        commandSent = true;
    }
    else if (!ManagerMotor_IsGoalStateReady(MMOT_MOTOR_1) &&
             !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_2) &&
             !ManagerMotor_IsGoalStateReady(MMOT_MOTOR_3))
    {
        posReached  = true;
        commandSent = false;
    }
    return posReached;
}

/*
 * Utilities
 */
autoPlanInfo_t* ManagerMovement_GetPlanData()
{
    // Copy the infos
    autoPlanInfo.autoState   = managerMovement.autoState;
    autoPlanInfo.homingState = managerMovement.homingState;
    autoPlanInfo.repsCount   = repsCount;
    autoPlanInfo.exCount     = exerciseIdx;

    // return the struct's address
    return &autoPlanInfo;
}

uint8_t ManagerMovement_GetState()
{
    return managerMovement.state;
}

bool ManagerMovement_SetState(uint8_t newState)
{
    bool stateChanged = false;

    if (newState != managerMovement.state)
    {
        if (newState == MMOV_STATE_AUTOMATIC &&
            managerMovement.state != MMOV_STATE_HOMING)
        {
            managerMovement.autoState = MMOV_AUTO_STATE_WAITING4PLAN;
            stateChanged              = true;
        }
        else if (newState == MMOV_STATE_HOMING)
        {
            managerMovement.homingState = MMOV_VERIF_PERSON_IN;
            stateChanged                = true;
        }
        else if (newState == MMOV_STATE_MANUAL &&
                 managerMovement.state != MMOV_STATE_HOMING)
        {
            stateChanged = true;
        }

        if (stateChanged)
        {
            managerMovement.state = newState;
        }
    }
    else
    {
        stateChanged = true;
    }

    return stateChanged;
}

bool ManagerMovement_InsideLimitSwitch()
{
    bool insideSwitchHit = false;

    if (PeriphSwitch_LegRight())
    {
        insideSwitchHit = PeriphSwitch_EversionLeft();
    }
    else if (PeriphSwitch_LegRight())
    {
        insideSwitchHit = PeriphSwitch_EversionRight();
    }

    return insideSwitchHit;
}

bool ManagerMovement_OutsideLimitSwitch()
{
    bool outsideSwitchHit = false;

    if (PeriphSwitch_LegRight())
    {
        outsideSwitchHit = PeriphSwitch_EversionRight();
    }
    else if (PeriphSwitch_LegRight())
    {
        outsideSwitchHit = PeriphSwitch_EversionLeft();
    }

    return outsideSwitchHit;
}
