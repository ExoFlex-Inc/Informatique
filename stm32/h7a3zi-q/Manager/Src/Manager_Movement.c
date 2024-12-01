
#include <Manager_Error.h>
#include <Manager_HMI.h>
#include <Manager_Motor.h>
#include <Manager_Movement.h>
#include <Periph_Solenoid.h>
#include <Periph_Switch.h>
#include <Periph_UartRingBuf.h>
#include <string.h>

#define MMOV_EXT_RESTPOS 1.5
#define MMOV_EVR_RESTPOS 0.30
#define MMOV_DOR_RESTPOS 0.0

#define MAX_EXERCISES 10
#define MAX_MOVEMENT  3
#define EXTREME_POS   4

#define MMOV_DELTA_CHANGESIDE 0.13  // rad

#define MMOV_SPEED_M1 0.5  // rad/s
#define MMOV_SPEED_M2 0.5  // rad/s
#define MMOV_SPEED_M3 0.2  // rad/s

#define MMOV_SPEED_MIN_M1 0.1  // rad/s
#define MMOV_SPEED_MIN_M2 0.1  // rad/s
#define MMOV_SPEED_MIN_M3 0.1  // rad/s

#define MANUAL_MAX_TRANSMIT_TIME 200  // ms

#define MMOV_CHANGESIDE_STATE_STARTINGPOS 0
#define MMOV_CHANGESIDE_STATE_GETCMD      1
#define MMOV_CHANGESIDE_STATE_MOVERIGHT   2
#define MMOV_CHANGESIDE_STATE_MOVELEFT    3
#define MMOV_CHANGESIDE_STATE_RESTPOS     4

typedef struct
{
    uint8_t state;
    uint8_t autoState;
    uint8_t changeSideState;
    uint8_t homingState;

    float mPosGoal[MMOT_MOTOR_NBR];
    float mSpeedGoal[MMOT_MOTOR_NBR];
    float mSpeedMin[MMOT_MOTOR_NBR];
    float mTorqueGoal[MMOT_MOTOR_NBR];

    bool    reset;
    bool    securityPass;
    uint8_t currentLegSide;

} ManagerMovement_t;

typedef struct
{
    float maxAngle;
    float maxTorque;

} movementLimits_t;

ManagerMovement_t managerMovement;
autoPlanInfo_t    autoPlanInfo;

movementLimits_t legRightLimits[MAX_MOVEMENT];
movementLimits_t legLeftLimits[MAX_MOVEMENT];

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

bool isAtFirstPos;
bool resetCmdSent;

bool changeSideFree;
bool eversionFree;

// Left and right pos for homing
float leftPos;
float rightPos;
float middlePos;

uint8_t movements[MAX_EXERCISES];
uint8_t repetitions[MAX_EXERCISES];
uint8_t mvtNbr[MAX_EXERCISES];

float exercisesTime[MAX_EXERCISES];
float pauseTime[MAX_EXERCISES];
float targetTorques[MAX_EXERCISES];
float finalPos[MAX_EXERCISES];
float firstPos[MAX_MOVEMENT];

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
void ManagerMovement_ManualIncrement(uint8_t id, int8_t factor);
void ManagerMovement_StopMotorsCmd();

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
void ManagerMovement_ChangeSideStartingPos();
void ManagerMovement_ChangeSideGetCmd();
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
bool  ManagerMovement_GoToMultiplePos(float eversionPos, float dorsiflexionPos,
                                      float extensionPos);
void  ManagerMovement_AutoMovement(uint8_t mouvType, float Position);
void  ManagerMovement_AutoTorque(uint8_t mouvType, float posLimit,
                                 float targetTorque);
void  ManagerMovement_SetFirstPos(uint8_t exerciseIdx);
float ManagerMovement_GetMiddlePos(float leftPos, float rightPos);
void  ManagerMovement_SetOrigins(uint8_t id);

void ManagerMovement_Init()
{
    ManagerMovement_Reset();
}

void ManagerMovement_Reset()
{
    // Get motor data (const pointer : read-only)
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motorsData[i]               = ManagerMotor_GetMotorData(i);
        managerMovement.mPosGoal[i] = 0.0f;

        firstPos[i] = 0.0f;
    }

    managerMovement.mSpeedGoal[MMOT_MOTOR_1] = MMOV_SPEED_M1;
    managerMovement.mSpeedGoal[MMOT_MOTOR_2] = MMOV_SPEED_M2;
    managerMovement.mSpeedGoal[MMOT_MOTOR_3] = MMOV_SPEED_M3;

    managerMovement.mSpeedMin[MMOT_MOTOR_1] = MMOV_SPEED_MIN_M1;
    managerMovement.mSpeedMin[MMOT_MOTOR_2] = MMOV_SPEED_MIN_M2;
    managerMovement.mSpeedMin[MMOT_MOTOR_3] = MMOV_SPEED_MIN_M3;

    // Init exercises tables
    for (uint8_t i = 0; i < MAX_EXERCISES; i++)
    {
        finalPos[i] = 0.0f;

        repetitions[i]   = 0;
        mvtNbr[i]        = 0;
        exercisesTime[i] = 0.0f;
        pauseTime[i]     = 0.0f;
        targetTorques[i] = 0.0f;
    }

    // Init Auto counters and buttons
    startButton = false;
    stopButton  = false;

    exerciseIdx = 0;
    movementIdx = 0;
    repsCount   = 0;

    commandSent  = false;
    isAtFirstPos = false;
    resetCmdSent = false;

    changeSideFree = false;
    eversionFree   = false;
    eversionFree   = false;

    pos1Reached = false;
    pos2Reached = false;
    pos3Reached = false;

    // Init modes' states
    managerMovement.reset          = false;
    managerMovement.securityPass   = false;
    managerMovement.currentLegSide = 0;

    managerMovement.state           = MMOV_STATE_WAITING_SECURITY;
    managerMovement.autoState       = MMOV_AUTO_STATE_WAITING4PLAN;
    managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_STARTINGPOS;
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
        break;

    case MMOV_STATE_ERROR:
        PeriphSolenoid_StopPWMs();
        break;
    }
}

/*
 * Task functions
 */

void ManagerMovement_WaitingSecurity()
{
    managerMovement.currentLegSide = PeriphSwitch_GetLegSide();
    if (managerMovement.securityPass && managerMovement.currentLegSide != 0)
    {
        managerMovement.state = MMOV_STATE_MANUAL;
    }
}

void ManagerMovement_Manual()
{
    if (PeriphUartRingBuf_GetRxTimerDelay() > MANUAL_MAX_TRANSMIT_TIME)
    {
        ManagerMovement_StopMotorsCmd();
        PeriphSolenoid_StopPWMs();
    }
}

void ManagerMovement_Homing()
{
    switch (managerMovement.homingState)
    {
    case MMOV_VERIF_PERSON_IN:
        managerMovement.homingState = MMOV_HOMING_EXTENSION;
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
    case MMOV_CHANGESIDE_STATE_STARTINGPOS:
        ManagerMovement_ChangeSideStartingPos();

        break;

    case MMOV_CHANGESIDE_STATE_GETCMD:
        ManagerMovement_ChangeSideGetCmd();

        break;

    case MMOV_CHANGESIDE_STATE_MOVERIGHT:
        ManagerMovement_ChangeSideRight();

        break;

    case MMOV_CHANGESIDE_STATE_MOVELEFT:
        ManagerMovement_ChangeSideLeft();

        break;
    case MMOV_CHANGESIDE_STATE_RESTPOS:
        ManagerMovement_RestPos();

        break;
    }
}

void ManagerMovement_ChangeSideGetCmd()
{
    if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
    {
        managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_MOVERIGHT;
    }
    else if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
    {
        managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_MOVELEFT;
    }
    else
    {
        managerMovement.currentLegSide = PeriphSwitch_GetLegSide();
    }
}

void ManagerMovement_ChangeSideStartingPos()
{
    // Change side pos
    float eversionPos     = 0.0f;
    float dorsiflexionPos = 0.78f;
    float extensionPos    = 0.4f;

    if (ManagerMovement_GoToMultiplePos(eversionPos, dorsiflexionPos,
                                        extensionPos))
    {
        managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_GETCMD;
    }
}

void ManagerMovement_ChangeSideRight()
{
    if ((PeriphSolenoid_UnlockChangeSide() &&
         PeriphSwitch_GetLegSide() == MMOV_LEG_IS_LEFT) ||
        changeSideFree)  // UNLOCK the soleinoid to allow changing side motion
    {
        changeSideFree = true;
        if ((PeriphSwitch_GetLegSide() == MMOV_LEG_IS_RIGHT &&
             ManagerMovement_InsideLimitSwitch()) ||
            managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
        {
            if (managerMovement.currentLegSide != MMOV_LEG_IS_RIGHT)
            {
                ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
                managerMovement.currentLegSide = MMOV_LEG_IS_RIGHT;
            }

            if (PeriphSolenoid_UnlockEversion() ||
                eversionFree)  // UNLOCK the soleinoid to allow eversion motion
            {
                eversionFree = true;
                ManagerMovement_HomingEversion();
            }
        }
        else
        {
            ManagerMovement_ManualCmdEversion(MMOV_INSIDE);
        }
    }
}

void ManagerMovement_ChangeSideLeft()
{
    if ((PeriphSolenoid_UnlockChangeSide() &&
         PeriphSwitch_GetLegSide() == MMOV_LEG_IS_RIGHT) ||
        changeSideFree)  // UNLOCK the soleinoid to allow changing side motion
    {
        changeSideFree = true;
        if ((PeriphSwitch_GetLegSide() == MMOV_LEG_IS_LEFT &&
             ManagerMovement_InsideLimitSwitch()) ||
            managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
        {
            if (managerMovement.currentLegSide != MMOV_LEG_IS_LEFT)
            {
                ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
                managerMovement.currentLegSide = MMOV_LEG_IS_LEFT;
            }

            if (PeriphSolenoid_UnlockEversion() ||
                eversionFree)  // UNLOCK the soleinoid to allow eversion motion
            {
                eversionFree = true;
                ManagerMovement_HomingEversion();
            }
        }
        else
        {
            ManagerMovement_ManualCmdEversion(MMOV_INSIDE);
        }
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
        if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
        {
            ManagerMovement_ManualIncrement(MMOT_MOTOR_2, -direction);
        }
        else if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
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

void ManagerMovement_ManualIncrement(uint8_t id, int8_t factor)
{
    // motor is ready when nextPos has been reached
    if (!ManagerMotor_IsGoalStateReady(id))
    {
        managerMovement.mPosGoal[id] = factor * EXTREME_POS;
        ManagerMotor_MovePosSpeed(id, managerMovement.mPosGoal[id],
                                  managerMovement.mSpeedGoal[id]);
    }

    // Else : do nothing so skip command to avoid an accumulation of
    // incrementation
}

void ManagerMovement_AutoMovement(uint8_t mouvType, float Position)
{
    if (mouvType == MMOV_DORSIFLEXION)  // Set goalPosition for motor 1 for
                                        // MMOV_DORSIFLEXION
    {
        managerMovement.mPosGoal[MMOT_MOTOR_1] = Position;
        ManagerMotor_MovePosSpeed(MMOT_MOTOR_1,
                                  managerMovement.mPosGoal[MMOT_MOTOR_1],
                                  managerMovement.mSpeedGoal[MMOT_MOTOR_1]);
    }
    else if (mouvType == MMOV_EVERSION)  // Set goalPosition for motor 2 and
                                         // for MMOV_EVERSION
    {
        if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
        {
            managerMovement.mPosGoal[MMOT_MOTOR_2] = -Position;
        }
        else if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
        {
            managerMovement.mPosGoal[MMOT_MOTOR_2] = Position;
        }
        ManagerMotor_MovePosSpeed(MMOT_MOTOR_2,
                                  managerMovement.mPosGoal[MMOT_MOTOR_2],
                                  managerMovement.mSpeedGoal[MMOT_MOTOR_2]);
    }
    else if (mouvType ==
             MMOV_EXTENSION)  // Set goalPosition for motor 3 for MMOV_EXTENSION
    {
        managerMovement.mPosGoal[MMOT_MOTOR_3] = Position;
        ManagerMotor_MovePosSpeed(MMOT_MOTOR_3,
                                  managerMovement.mPosGoal[MMOT_MOTOR_3],
                                  managerMovement.mSpeedGoal[MMOT_MOTOR_3]);
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

void ManagerMovement_AddLimits(uint8_t idx, float maxPos, float maxTorque,
                               uint8_t side)
{
    if (side == MMOV_LEG_IS_LEFT)
    {
        legLeftLimits[idx].maxAngle  = maxPos;
        legLeftLimits[idx].maxTorque = maxTorque;
    }
    else if (side == MMOV_LEG_IS_RIGHT)
    {
        legRightLimits[idx].maxAngle  = maxPos;
        legRightLimits[idx].maxTorque = maxTorque;
    }
}

void ManagerMovement_AddMouvement(uint8_t mvtIdx, uint8_t movementType,
                                  float finalPosition, float targetTorque)
{
    movements[mvtIdx]     = movementType;
    finalPos[mvtIdx]      = finalPosition;
    targetTorques[mvtIdx] = targetTorque;
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
        targetTorques[i] = 0.0f;
    }
    if (managerMovement.autoState != MMOV_AUTO_STATE_READY)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_WAITING4PLAN;
    }
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
        if (movements[i + movementIdx] == MMOV_DORSIFLEXION)
        {
            firstPos[i] = motorsData[MMOT_MOTOR_1]->position;
        }
        else if (movements[i + movementIdx] == MMOV_EVERSION)
        {
            if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
            {
                firstPos[i] = -motorsData[MMOT_MOTOR_2]->position;
            }
            else if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
            {
                firstPos[i] = motorsData[MMOT_MOTOR_2]->position;
            }
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
    if (exerciseIdx == MAX_EXERCISES)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_STOP;
    }
    else
    {
        // Waiting for button Start on HMI
        if (startButton)
        {
            if (repsCount == 0)
            {
                // Set the position that the exercise is starting
                ManagerMovement_SetFirstPos(mvtNbr[exerciseIdx]);
            }
            // Start streaching sequence
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
        isAtFirstPos = false;
        movementIdx--;

        pos1Reached = false;
        pos2Reached = false;
        pos3Reached = false;

        exerciseTimer             = HAL_GetTick();
        managerMovement.autoState = MMOV_AUTO_STATE_STRETCHING;
    }
}

void ManagerMovement_AutoStrectching()
{
    // Keep the position until time is over
    // Serait la place ou mettre un commande en force

    if (stopButton || !startButton)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_STOP;
        ManagerMovement_StopMotorsCmd();
    }
    else
    {
#ifndef MMOV_DISABLE_TORQUE_STRETCHING

        // cmd flags
        static bool cmd1Sent = false;
        static bool cmd2Sent = false;
        static bool cmd3Sent = false;

        static bool decreaseMvtNbr = false;

        uint8_t movementNbr = mvtNbr[exerciseIdx];
        if (!decreaseMvtNbr)
        {
            movementIdx -= movementNbr - 1;
            decreaseMvtNbr = true;
        }

        // Get movement info
        uint8_t currentMovement = movements[movementIdx];
        float   goToTorque      = targetTorques[movementIdx];

        float angleLimit = 0.0f;

        // Get Angle limit from legSide

        if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
        {
            angleLimit = legLeftLimits[currentMovement - 1].maxAngle;
        }
        else if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
        {
            angleLimit = legRightLimits[currentMovement - 1].maxAngle;
        }

        // Send Torque commandes
        if (currentMovement == MMOV_EVERSION)
        {
            if (movementIdx % 3 == 0)
            {
                cmd1Sent = true;
            }
            else if (movementIdx % 3 == 1)
            {
                cmd2Sent = true;
            }
            else if (movementIdx % 3 == 2)
            {
                cmd3Sent = true;
            }
            movementIdx++;
        }
        else
        {
            if (!cmd1Sent && movementNbr >= 1)
            {
                ManagerMovement_AutoTorque(currentMovement, angleLimit,
                                           goToTorque);
                cmd1Sent = true;
                movementIdx++;
            }
            else if (!cmd2Sent && movementNbr >= 2)
            {
                ManagerMovement_AutoTorque(currentMovement, angleLimit,
                                           goToTorque);
                cmd2Sent = true;
                movementIdx++;
            }
            else if (!cmd3Sent && movementNbr >= 3)
            {
                ManagerMovement_AutoTorque(currentMovement, angleLimit,
                                           goToTorque);
                cmd3Sent = true;
                movementIdx++;
            }
        }

#endif
        // TODO: Faire arreter l etirement si le torque ressentit depasse la
        // limit de couple

        if (HAL_GetTick() - exerciseTimer >= exercisesTime[exerciseIdx])
        {
            ManagerMovement_StopMotorsCmd();

            managerMovement.autoState = MMOV_AUTO_STATE_2FIRST_POS;

#ifndef MMOV_DISABLE_TORQUE_STRETCHING
            cmd1Sent       = false;
            cmd2Sent       = false;
            cmd3Sent       = false;
            decreaseMvtNbr = false;
#endif
        }
    }
}

void ManagerMovement_Auto2FirstPos()
{
    /* The machine executes the same series of position, but in reverse and
     * going back to the firstPos. Once the positions are reached, movementIdx
     * is incremented to the last movement done, the flags are reset, and the
     * state is changed.
     */
    if (!resetCmdSent)
    {
        movementIdx = mvtNbr[exerciseIdx] - 1;
        if (exerciseIdx != 0)
        {
            for (uint8_t i = 0; i < exerciseIdx; i++)
            {
                movementIdx += mvtNbr[i];
            }
        }
        resetCmdSent = true;
    }

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
        isAtFirstPos = true;

        pos1Reached  = false;
        pos2Reached  = false;
        pos3Reached  = false;
        resetCmdSent = false;

        movementIdx++;

        if (!startButton ||
            stopButton)  // if called by state STOP, go back to STOP
        {
            managerMovement.autoState = MMOV_AUTO_STATE_STOP;
        }
        else  // If called by State FIRSTPOS, go to REST
        {
            pauseTimer                = HAL_GetTick();
            managerMovement.autoState = MMOV_AUTO_STATE_REST;
        }
    }
}

void ManagerMovement_AutoRest()
{
    if (stopButton || !startButton)
    {
        managerMovement.autoState = MMOV_AUTO_STATE_STOP;
    }
    else if (HAL_GetTick() - pauseTimer >= pauseTime[exerciseIdx])
    {
        if (repsCount >=
            repetitions[exerciseIdx] - 1)  // Reps are done, got to STOP
        {
            managerMovement.autoState = MMOV_AUTO_STATE_STOP;
        }
        else  // Continue exercise with next rep
        {
            managerMovement.autoState = MMOV_AUTO_STATE_2GOAL;
            repsCount++;
        }
    }
}

void ManagerMovement_AutoStop()
{
    if (!isAtFirstPos)
    {
        ManagerMovement_Auto2FirstPos();  // Go to firstPos if not there
    }
    else
    {
        if (startButton)  // In state stop because exercise is over
        {
            movementIdx += mvtNbr[exerciseIdx];
            exerciseIdx++;
            repsCount = 0;
        }

        // Reset the counter if exercises are done or if stop command on the HMI
        if (mvtNbr[exerciseIdx] == 0 || stopButton)
        {
            exerciseIdx = 0;
            movementIdx = 0;
            repsCount   = 0;

            // Update HMI with end of exercise
            ManagerHMI_SendNow();
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
        if (!exUpLimitHit)
        {
            exUpLimitHit = true;
            ManagerMotor_StopManualMovement(MMOT_MOTOR_3);
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
            ManagerMovement_ManualCmdExtension(MMOV_DOWN_EXT);
        }
    }
    else
    {
        ManagerMovement_ManualCmdExtension(MMOV_UP_EXT);
    }
}

void ManagerMovement_HomingEversion()
{
    // Increment until limitswitch
    if (ManagerMovement_InsideLimitSwitch() || evInsideLimitHit)
    {
        if (!evInsideLimitHit)
        {
            leftPos          = motorsData[MMOT_MOTOR_2]->position;
            evInsideLimitHit = true;
            ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
        }

        if (ManagerMovement_OutsideLimitSwitch() || evOutsideLimitHit)
        {
            if (!evOutsideLimitHit)
            {
                rightPos          = motorsData[MMOT_MOTOR_2]->position;
                evOutsideLimitHit = true;
                ManagerMotor_StopManualMovement(MMOT_MOTOR_2);

                middlePos = ManagerMovement_GetMiddlePos(leftPos, rightPos);
                if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
                {
                    middlePos = -middlePos;
                }
            }

            if (ManagerMovement_GoToPos(MMOV_EVERSION, middlePos))
            {
                ManagerMovement_SetOrigins(MMOT_MOTOR_2);

                evInsideLimitHit  = false;
                evOutsideLimitHit = false;

                if (managerMovement.state == MMOV_STATE_CHANGESIDE)
                {
                    PeriphSolenoid_ResetPWMState();
                    managerMovement.changeSideState =
                        MMOV_CHANGESIDE_STATE_RESTPOS;
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
        if (!dorUpLimitHit)
        {
            leftPos       = motorsData[MMOT_MOTOR_1]->position;
            dorUpLimitHit = true;
            ManagerMotor_StopManualMovement(MMOT_MOTOR_1);

            managerMovement.currentLegSide =
                PeriphSwitch_GetLegSide();  // Get leg side when the foot is at
                                            // highest
        }

        if (PeriphSwitch_DorsiflexionDown() || dorDownLimitHit)
        {
            if (!dorDownLimitHit)
            {
                rightPos        = motorsData[MMOT_MOTOR_1]->position;
                dorDownLimitHit = true;
                ManagerMotor_StopManualMovement(MMOT_MOTOR_1);
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
    if (ManagerMovement_GoToMultiplePos(MMOV_EVR_RESTPOS, MMOV_DOR_RESTPOS,
                                        MMOV_EXT_RESTPOS))
    {
        if (managerMovement.state == MMOV_STATE_CHANGESIDE)
        {
            managerMovement.changeSideState = MMOV_CHANGESIDE_STATE_STARTINGPOS;
        }
        else
        {
            managerMovement.homingState = MMOV_HOMING_EXTENSION;
        }
        managerMovement.state = MMOV_STATE_MANUAL;
    }
}

float ManagerMovement_GetMiddlePos(float leftPos, float rightPos)
{
    float middlePos = (leftPos + rightPos) / 2.0;

    return middlePos;
}

void ManagerMovement_SetOrigins(uint8_t id)
{
    ManagerMotor_SoftwareOrigin(id);
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

bool ManagerMovement_GoToMultiplePos(float eversionPos, float dorsiflexionPos,
                                     float extensionPos)
{
    // Local Switch case
    static uint8_t goToPosState = 0;

    bool allPosReached = false;

    switch (goToPosState)
    {
    case MMOV_MOVESTATE_EVERSION:
        if (ManagerMovement_GoToPos(MMOV_EVERSION, eversionPos))
        {
            goToPosState = MMOV_MOVESTATE_DORSIFLEXION;
        }

        break;

    case MMOV_MOVESTATE_DORSIFLEXION:
        if (ManagerMovement_GoToPos(MMOV_DORSIFLEXION, dorsiflexionPos))
        {
            goToPosState = MMOV_MOVESTATE_EXTENSION;
        }

        break;

    case MMOV_MOVESTATE_EXTENSION:
        if (ManagerMovement_GoToPos(MMOV_EXTENSION, extensionPos))
        {
            goToPosState  = MMOV_MOVESTATE_EVERSION;
            allPosReached = true;
        }

        break;
    }

    return allPosReached;
}

/*
 * Utilities
 */
autoPlanInfo_t* ManagerMovement_GetPlanData()
{
    // Copy the infos
    autoPlanInfo.autoState   = managerMovement.autoState;
    autoPlanInfo.homingState = managerMovement.homingState;
    autoPlanInfo.legSide     = managerMovement.currentLegSide;
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

    if (managerMovement.state == MMOV_STATE_MANUAL ||
        managerMovement.state == MMOV_STATE_AUTOMATIC)
    {
        if (newState != managerMovement.state)
        {
            if (newState == MMOV_STATE_AUTOMATIC &&
                managerMovement.state != MMOV_STATE_HOMING &&
                ManagerMotor_HasMachineHomed())
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
            else if (newState == MMOV_STATE_CHANGESIDE &&
                     managerMovement.state != MMOV_STATE_HOMING &&
                     ManagerMotor_HasMachineHomed())
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
    }

    return stateChanged;
}

bool ManagerMovement_InsideLimitSwitch()
{
    bool insideSwitchHit = false;

    if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
    {
        insideSwitchHit = PeriphSwitch_EversionRight();
    }
    else if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
    {
        insideSwitchHit = PeriphSwitch_EversionLeft();
    }

    return insideSwitchHit;
}

bool ManagerMovement_OutsideLimitSwitch()
{
    bool outsideSwitchHit = false;

    if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
    {
        outsideSwitchHit = PeriphSwitch_EversionRight();
    }
    else if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
    {
        outsideSwitchHit = PeriphSwitch_EversionLeft();
    }

    return outsideSwitchHit;
}

void ManagerMovement_AutoTorque(uint8_t mouvType, float posLimit,
                                float targetTorque)
{
    if (mouvType == MMOV_DORSIFLEXION)  // Set goalPosition for motor 1 for
                                        // MMOV_DORSIFLEXION
    {
        managerMovement.mPosGoal[MMOT_MOTOR_1]    = posLimit;
        managerMovement.mTorqueGoal[MMOT_MOTOR_1] = targetTorque;
        ManagerMotor_MovePosSpeedTorque(
            MMOT_MOTOR_1, managerMovement.mPosGoal[MMOT_MOTOR_1],
            managerMovement.mSpeedMin[MMOT_MOTOR_1],
            managerMovement.mSpeedGoal[MMOT_MOTOR_1],
            managerMovement.mTorqueGoal[MMOT_MOTOR_1]);
    }
    else if (mouvType == MMOV_EVERSION)  // Set goalPosition for motor 2 and
                                         // for MMOV_EVERSION
    {
        if (managerMovement.currentLegSide == MMOV_LEG_IS_LEFT)
        {
            managerMovement.mPosGoal[MMOT_MOTOR_2] = -posLimit;
        }
        else if (managerMovement.currentLegSide == MMOV_LEG_IS_RIGHT)
        {
            managerMovement.mPosGoal[MMOT_MOTOR_2] = posLimit;
        }
        managerMovement.mTorqueGoal[MMOT_MOTOR_2] = targetTorque;
        ManagerMotor_MovePosSpeedTorque(
            MMOT_MOTOR_2, managerMovement.mPosGoal[MMOT_MOTOR_2],
            managerMovement.mSpeedMin[MMOT_MOTOR_2],
            managerMovement.mSpeedGoal[MMOT_MOTOR_2],
            managerMovement.mTorqueGoal[MMOT_MOTOR_2]);
    }
    else if (mouvType ==
             MMOV_EXTENSION)  // Set goalPosition for motor 3 for MMOV_EXTENSION
    {
        managerMovement.mPosGoal[MMOT_MOTOR_3]    = posLimit;
        managerMovement.mTorqueGoal[MMOT_MOTOR_3] = targetTorque;
        ManagerMotor_MovePosSpeedTorque(
            MMOT_MOTOR_3, managerMovement.mPosGoal[MMOT_MOTOR_3],
            managerMovement.mSpeedMin[MMOT_MOTOR_3],
            managerMovement.mSpeedGoal[MMOT_MOTOR_3],
            managerMovement.mTorqueGoal[MMOT_MOTOR_3]);
    }
}

void ManagerMovement_StopMotorsCmd()
{
    ManagerMotor_StopManualMovement(MMOT_MOTOR_1);
    ManagerMotor_StopManualMovement(MMOT_MOTOR_2);
    ManagerMotor_StopManualMovement(MMOT_MOTOR_3);
}
