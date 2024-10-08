#include <Manager_Error.h>
#include <Manager_Motor.h>
#include <Periph_Canbus.h>
#include <Periph_Switch.h>

#define MMOT_MOTOR_1_CAN_ID 1
#define MMOT_MOTOR_2_CAN_ID 2
#define MMOT_MOTOR_3_CAN_ID 3

#define MMOT_MOVING_MAX_SPEED  200
#define MMOT_MOVING_MAX_TORQUE 200
#define MMOT_IDLE_MAX_SPEED    200
#define MMOT_IDLE_MAX_TORQUE   100

#define MMOT_MOT1_MIN_POS -10
#define MMOT_MOT1_MAX_POS 10
#define MMOT_MOT2_MIN_POS -10
#define MMOT_MOT2_MAX_POS 10
#define MMOT_MOT3_MIN_POS -10
#define MMOT_MOT3_MAX_POS 10

// Error Codes
#define ERROR_SET_ORIGINES_MOTORS   -1
#define ERROR_CAN_CONNECTION_MOTORS -2
#define ERROR_CAN_MAX_MSG_DELAY     -3
#define ERROR_MOTOR_MINMAX          -4

#define TIMER   10
#define MAX_TRY 50  // 500 ms before flagging an error

#define MOTOR_STEP   0.005
#define MOTOR3_STEP  0.002
#define POSITION_TOL 0.01

#define MMOT_MAX_MSG_DELAY 30

#define MMOT_INIT_IDLE          0
#define MMOT_INIT_START         1
#define MMOT_INIT_START_OK      2
#define MMOT_INIT_DISABLEMOV    3
#define MMOT_INIT_DISABLEMOV_OK 4
#define MMOT_INIT_ORIGIN        5
#define MMOT_INIT_OK            6
#define MMOT_INIT_ERROR         7

typedef struct
{
    Motor    motor;
    uint8_t  controlType;
    float    nextPosition;
    float    goalPosition;
    float    goalTorque;
    float    goalSpeed;
    float    kp;
    float    kd;
    uint8_t  initState;
    uint8_t  initTry;
    bool     detected;
    bool     goalReady;
    uint32_t lastMsgTime;

    float originShift;
} MotorControl;

typedef struct
{
    uint8_t state;
    int8_t  errorCode;
    bool    reset;
    bool    securityPass;
    bool    setupFirstPass;

} managerMotor_t;

static uint32_t timerMs = 0;

MotorControl motors[MMOT_MOTOR_NBR];
uint8_t      data[8];

int8_t motorsMinPos[MMOT_MOTOR_NBR];
int8_t motorsMaxPos[MMOT_MOTOR_NBR];

managerMotor_t managerMotor;

float torqueMaxKp;
float torqueMinKp;

// Prototypes
void ManagerMotor_Reset();
void ManagerMotor_ReceiveFromMotors();
void ManagerMotor_WaitingSecurity();
void ManagerMotor_StartMotors();
void ManagerMotor_StartMotor(uint8_t motorIndex);
void ManagerMotor_CalculateNextPositions();
void ManagerMotor_SendToMotors();
void ManagerMotor_DisableMotors();

void ManagerMotor_VerifyMotorsConnection();
void ManagerMotor_VerifyMotorsState();
bool ManagerMotor_VerifyMotorState(uint8_t motorIndex);

void   ManagerMotor_ApplyOriginShift(uint8_t motorIndex);
int8_t ManagerMotor_GetMotorDirection(uint8_t motorIndex);
void   ManagerMotor_MotorIncrement(uint8_t motorIndex, int8_t direction);
void   ManagerMotor_CalculNextKp(uint8_t motorIndex);

void ManagerMotor_SetMotorError(uint8_t motorIndex);

/********************************************
 * Manager init and reset
 ********************************************/

void ManagerMotor_Init()
{
    // InitCanBus
    PeriphCanbus_Init();
    PeriphMotors_Init(PeriphCanbus_TransmitDLC8);
    HAL_Delay(50);

    ManagerMotor_Reset();
}

void ManagerMotor_Reset()
{
    // Init motors
#ifndef MMOT_DEV_MOTOR_1_DISABLE
    PeriphMotors_InitMotor(&motors[MMOT_MOTOR_1].motor, MMOT_MOTOR_1_CAN_ID,
                           MOTOR_AK10_9);
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE
    PeriphMotors_InitMotor(&motors[MMOT_MOTOR_2].motor, MMOT_MOTOR_2_CAN_ID,
                           MOTOR_AK10_9);
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE
    PeriphMotors_InitMotor(&motors[MMOT_MOTOR_3].motor, MMOT_MOTOR_3_CAN_ID,
                           MOTOR_AK80_64);
#endif

    // Init motor control info
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motors[i].controlType  = MMOT_CONTROL_POSITION;
        motors[i].nextPosition = 0.0;
        motors[i].goalPosition = 0.0;
        motors[i].goalTorque   = 0.0;
        motors[i].goalSpeed    = 0.0;
        motors[i].detected     = false;
        motors[i].goalReady    = false;
        motors[i].lastMsgTime  = 0;
        motors[i].originShift  = 0.0f;
        motors[i].initState    = MMOT_INIT_IDLE;
        motors[i].initTry      = 0;
    }

    // Set Kp Kd
    // AK 10-9
    motors[MMOT_MOTOR_1].kp = 100.0f;
    motors[MMOT_MOTOR_1].kd = 5.0f;
    motors[MMOT_MOTOR_2].kp = 100.0f;
    motors[MMOT_MOTOR_2].kd = 5.0f;
    // AK 80-64
    motors[MMOT_MOTOR_3].kp = 300.0f;
    motors[MMOT_MOTOR_3].kd = 5.0f;

    // Set max min pos
    motorsMinPos[MMOT_MOTOR_1] = MMOT_MOT1_MIN_POS;
    motorsMaxPos[MMOT_MOTOR_1] = MMOT_MOT1_MAX_POS;
    motorsMinPos[MMOT_MOTOR_2] = MMOT_MOT2_MIN_POS;
    motorsMaxPos[MMOT_MOTOR_2] = MMOT_MOT2_MAX_POS;
    motorsMinPos[MMOT_MOTOR_3] = MMOT_MOT3_MIN_POS;
    motorsMaxPos[MMOT_MOTOR_3] = MMOT_MOT3_MAX_POS;

    // Init Data for canBus messages
    for (uint8_t i = 0; i < 8; i++)
    {
        data[i] = 0;
    }

    // Init State machine
    managerMotor.reset          = false;
    managerMotor.securityPass   = false;
    managerMotor.setupFirstPass = true;
    managerMotor.state          = MMOT_STATE_WAITING_SECURITY;

    torqueMaxKp = 10.0;
    torqueMinKp = 3.0;
}

void ManagerMotor_Task()
{
    // State machine that Init, sets to zero, reads informations and sends
    // informations to the motors
    ManagerMotor_ReceiveFromMotors();
    ManagerMotor_VerifyMotorsState();

    if (HAL_GetTick() - timerMs >= TIMER)
    {
        switch (managerMotor.state)
        {
        case MMOT_STATE_WAITING_SECURITY:
            ManagerMotor_WaitingSecurity();
            break;

        case MMOT_STATE_START_MOTORS:
            ManagerMotor_StartMotors();
            break;

        case MMOT_STATE_READY2MOVE:
            ManagerMotor_CalculateNextPositions();
            ManagerMotor_SendToMotors();
            ManagerMotor_VerifyMotorsConnection();

            break;

        case MMOT_STATE_ERROR:
            ManagerMotor_DisableMotors();
            ManagerError_SetError(ERROR_2_MMOT);
            break;
        }
        timerMs = HAL_GetTick();
    }
}

/********************************************
 * Motor data reception
 ********************************************/

void ManagerMotor_ReceiveFromMotors()
{
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        uint32_t lastMsgTime = motors[i].lastMsgTime;
        if (PeriphCanbus_GetNodeMsg(motors[i].motor.id, data,
                                    &motors[i].lastMsgTime) &&
            data[0] != '\0')
        {
            if (lastMsgTime < motors[i].lastMsgTime)
            {
                PeriphMotors_ParseMotorState(&motors[i].motor, data);
                ManagerMotor_ApplyOriginShift(i);
                motors[i].detected = true;
            }
        }
    }
}

/********************************************
 * Motor initialisation
 ********************************************/

void ManagerMotor_StartMotors()
{
    bool verifM1 = true;
    bool verifM2 = true;
    bool verifM3 = true;

#ifndef MMOT_DEV_MOTOR_1_DISABLE
    ManagerMotor_StartMotor(MMOT_MOTOR_1);
    if (motors[MMOT_MOTOR_1].initState != MMOT_INIT_OK)
    {
        verifM1 = false;
    }
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE
    ManagerMotor_StartMotor(MMOT_MOTOR_2);
    if (motors[MMOT_MOTOR_2].initState != MMOT_INIT_OK)
    {
        verifM1 = false;
    }
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE
    ManagerMotor_StartMotor(MMOT_MOTOR_3);
    if (motors[MMOT_MOTOR_3].initState != MMOT_INIT_OK)
    {
        verifM1 = false;
    }
#endif

    if (verifM1 && verifM2 && verifM3)
    {
        managerMotor.state = MMOT_STATE_READY2MOVE;
    }
}

void ManagerMotor_StartMotor(uint8_t motorIndex)
{
    switch (motors[motorIndex].initState)
    {
    case MMOT_INIT_IDLE:
        motors[motorIndex].detected  = false;
        motors[motorIndex].initTry   = 0;
        motors[motorIndex].initState = MMOT_INIT_START;

        break;
    case MMOT_INIT_START:

        if (motors[motorIndex].detected)
        {
            motors[motorIndex].initState = MMOT_INIT_START_OK;
        }
        else if (motors[motorIndex].initTry < MAX_TRY)
        {
            PeriphMotors_Enable(&motors[motorIndex].motor);
            motors[motorIndex].initTry += 1;
        }
        else
        {
            motors[motorIndex].initState = MMOT_INIT_ERROR;
            managerMotor.state           = MMOT_STATE_ERROR;
            managerMotor.errorCode       = ERROR_CAN_CONNECTION_MOTORS;
            ManagerError_SetError(ERROR_14_MMOT_CAN_CONNECT);
            ManagerMotor_SetMotorError(motorIndex);
        }

        break;

    case MMOT_INIT_START_OK:
        motors[motorIndex].detected  = false;
        motors[motorIndex].initTry   = 0;
        motors[motorIndex].initState = MMOT_INIT_DISABLEMOV;
        break;

    case MMOT_INIT_DISABLEMOV:
        if (motors[motorIndex].detected)
        {
            motors[motorIndex].initState = MMOT_INIT_DISABLEMOV_OK;
        }
        else if (motors[motorIndex].initTry < MAX_TRY)
        {
            PeriphMotors_Move(&motors[motorIndex].motor, 0, 0, 0, 0, 0);
            motors[motorIndex].initTry += 1;
        }
        else
        {
            motors[motorIndex].initState = MMOT_INIT_ERROR;
            managerMotor.state           = MMOT_STATE_ERROR;
            managerMotor.errorCode       = ERROR_CAN_CONNECTION_MOTORS;
            ManagerError_SetError(ERROR_14_MMOT_CAN_CONNECT);
            ManagerMotor_SetMotorError(motorIndex);
        }
        break;

    case MMOT_INIT_DISABLEMOV_OK:
        motors[motorIndex].detected  = false;
        motors[motorIndex].initTry   = 0;
        motors[motorIndex].initState = MMOT_INIT_ORIGIN;
        break;

    case MMOT_INIT_ORIGIN:
        if (motors[motorIndex].detected &&
            motors[motorIndex].motor.position <= 0.001 &&
            motors[motorIndex].motor.position >= -0.001)
        {
            motors[motorIndex].initState = MMOT_INIT_OK;
        }
        else if (motors[motorIndex].initTry < MAX_TRY)
        {
            PeriphMotors_SetZeroPosition(&motors[motorIndex].motor);
            motors[motorIndex].initTry += 1;
        }
        else
        {
            motors[motorIndex].initState = MMOT_INIT_ERROR;
            managerMotor.state           = MMOT_STATE_ERROR;
            managerMotor.errorCode       = ERROR_SET_ORIGINES_MOTORS;
            ManagerError_SetError(ERROR_16_MMOT_SET_ORIGIN);
            ManagerMotor_SetMotorError(motorIndex);
        }
        break;
    }
}

void ManagerMotor_SetMotorError(uint8_t motorIndex)
{
    if (motorIndex == MMOT_MOTOR_1)
    {
        ManagerError_SetError(ERROR_17_MOTOR_1);
    }
    else if (motorIndex == MMOT_MOTOR_2)
    {
        ManagerError_SetError(ERROR_18_MOTOR_2);
    }
    else if (motorIndex == MMOT_MOTOR_3)
    {
        ManagerError_SetError(ERROR_19_MOTOR_3);
    }
}

/********************************************
 * Calculate next action and send to motors
 ********************************************/

void ManagerMotor_CalculateNextPositions()
{
    if (motors[MMOT_MOTOR_1].controlType == MMOT_CONTROL_POSITION)
    {
        if (fabsf(motors[MMOT_MOTOR_1].motor.position -
                  motors[MMOT_MOTOR_1].goalPosition) > POSITION_TOL &&
            motors[MMOT_MOTOR_1].goalReady)
        {
            ManagerMotor_MotorIncrement(
                MMOT_MOTOR_1, ManagerMotor_GetMotorDirection(MMOT_MOTOR_1));
        }
        else
        {
            motors[MMOT_MOTOR_1].goalReady = false;  // Motor reached his goal
            motors[MMOT_MOTOR_1].goalPosition =
                motors[MMOT_MOTOR_1].motor.position;
        }
    }

    if (motors[MMOT_MOTOR_2].controlType == MMOT_CONTROL_POSITION)
    {
        if (fabsf(motors[MMOT_MOTOR_2].motor.position -
                  motors[MMOT_MOTOR_2].goalPosition) > POSITION_TOL &&
            motors[MMOT_MOTOR_2].goalReady)
        {
            ManagerMotor_MotorIncrement(
                MMOT_MOTOR_2, ManagerMotor_GetMotorDirection(MMOT_MOTOR_2));
        }
        else
        {
            motors[MMOT_MOTOR_2].goalReady = false;
            motors[MMOT_MOTOR_2].goalPosition =
                motors[MMOT_MOTOR_2].motor.position;
        }
    }

    if (motors[MMOT_MOTOR_3].controlType == MMOT_CONTROL_POSITION)
    {
        if (fabsf(motors[MMOT_MOTOR_3].motor.position -
                  motors[MMOT_MOTOR_3].goalPosition) > POSITION_TOL &&
            motors[MMOT_MOTOR_3].goalReady)
        {
            ManagerMotor_MotorIncrement(
                MMOT_MOTOR_3, ManagerMotor_GetMotorDirection(MMOT_MOTOR_3));
        }
        else
        {
            motors[MMOT_MOTOR_3].goalReady = false;
            motors[MMOT_MOTOR_3].goalPosition =
                motors[MMOT_MOTOR_3].motor.position;
        }
    }
}

void ManagerMotor_SendToMotors()
{
#ifndef MMOT_DEV_MOTOR_1_DISABLE
    if (motors[MMOT_MOTOR_1].controlType == MMOT_CONTROL_POSITION)
    {
        ManagerMotor_CalculNextKp(MMOT_MOTOR_1);
        PeriphMotors_Move(&motors[MMOT_MOTOR_1].motor,
                          motors[MMOT_MOTOR_1].nextPosition, 0, 0,
                          motors[MMOT_MOTOR_1].kp, motors[MMOT_MOTOR_1].kd);
    }
    else if (motors[MMOT_MOTOR_1].controlType == MMOT_CONTROL_TORQUE)
    {
        PeriphMotors_Move(&motors[MMOT_MOTOR_1].motor, 0, 0,
                          motors[MMOT_MOTOR_1].goalTorque, 0, 0);
    }
    else if (motors[MMOT_MOTOR_1].controlType == MMOT_CONTROL_SPEED)
    {
        PeriphMotors_Move(&motors[MMOT_MOTOR_1].motor, 0,
                          motors[MMOT_MOTOR_1].goalSpeed, 0, 0,
                          motors[MMOT_MOTOR_1].kd);
    }
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE
    if (motors[MMOT_MOTOR_2].controlType == MMOT_CONTROL_POSITION)
    {
        ManagerMotor_CalculNextKp(MMOT_MOTOR_2);
        PeriphMotors_Move(&motors[MMOT_MOTOR_2].motor,
                          motors[MMOT_MOTOR_2].nextPosition, 0, 0,
                          motors[MMOT_MOTOR_2].kp, motors[MMOT_MOTOR_2].kd);
    }
    else if (motors[MMOT_MOTOR_2].controlType == MMOT_CONTROL_TORQUE)
    {
        PeriphMotors_Move(&motors[MMOT_MOTOR_2].motor, 0, 0,
                          motors[MMOT_MOTOR_2].goalTorque, 0, 0);
    }
    else if (motors[MMOT_MOTOR_2].controlType == MMOT_CONTROL_SPEED)
    {
        PeriphMotors_Move(&motors[MMOT_MOTOR_2].motor, 0,
                          motors[MMOT_MOTOR_2].goalSpeed, 0, 0,
                          motors[MMOT_MOTOR_2].kd);
    }
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE
    if (motors[MMOT_MOTOR_3].controlType == MMOT_CONTROL_POSITION)
    {
        ManagerMotor_CalculNextKp(MMOT_MOTOR_3);
        PeriphMotors_Move(&motors[MMOT_MOTOR_3].motor,
                          motors[MMOT_MOTOR_3].nextPosition, 0, 0,
                          motors[MMOT_MOTOR_3].kp, motors[MMOT_MOTOR_3].kd);
    }
    else if (motors[MMOT_MOTOR_3].controlType == MMOT_CONTROL_TORQUE)
    {
        PeriphMotors_Move(&motors[MMOT_MOTOR_3].motor, 0, 0,
                          motors[MMOT_MOTOR_3].goalTorque, 0, 0);
    }
    else if (motors[MMOT_MOTOR_3].controlType == MMOT_CONTROL_SPEED)
    {
        PeriphMotors_Move(&motors[MMOT_MOTOR_3].motor, 0,
                          motors[MMOT_MOTOR_3].goalSpeed, 0, 0,
                          motors[MMOT_MOTOR_3].kd);
    }
#endif
}

/********************************************
 * Goal and movements SET/GET
 ********************************************/

Motor* ManagerMotor_GetMotorData(uint8_t motorIndex)
{
    return &motors[motorIndex].motor;
}

bool ManagerMotor_IsGoalStateReady(uint8_t motorIndex)
{
    return motors[motorIndex]
        .goalReady;  // motor is ready when it has reached it's command
}

void ManagerMotor_SetMotorGoal(uint8_t motorIndex, uint8_t controlType,
                               float goal)
{
    if (controlType == MMOT_CONTROL_POSITION)
    {
        motors[motorIndex].controlType  = MMOT_CONTROL_POSITION;
        motors[motorIndex].goalPosition = goal;
        motors[motorIndex].goalReady    = true;
    }
    else if (controlType == MMOT_CONTROL_TORQUE)
    {
        motors[motorIndex].controlType = MMOT_CONTROL_TORQUE;
        motors[motorIndex].goalTorque  = goal;
    }
    else if (controlType == MMOT_CONTROL_SPEED)
    {
        motors[motorIndex].controlType = MMOT_CONTROL_SPEED;
        motors[motorIndex].goalSpeed   = goal;
    }
}

int8_t ManagerMotor_GetMotorDirection(uint8_t motorIndex)
{
    if (motors[motorIndex].goalPosition < motors[motorIndex].motor.position)
    {
        return -1;
    }
    else
    {
        return 1;
    }
}

void ManagerMotor_MotorIncrement(uint8_t motorIndex, int8_t direction)
{
    if (motorIndex == MMOT_MOTOR_3)
    {
        motors[motorIndex].nextPosition += direction * MOTOR3_STEP;
    }
    else if (motorIndex == MMOT_MOTOR_1)
    {
        motors[motorIndex].nextPosition -= direction * MOTOR_STEP;
    }
    else if (motorIndex == MMOT_MOTOR_2)
    {
        motors[motorIndex].nextPosition += direction * MOTOR_STEP; // The positive side changes for the inside of the leg
    }
}
/********************************************
 * Security commands and verificartions
 ********************************************/
void ManagerMotor_WaitingSecurity()
{
    if (managerMotor.securityPass)
    {
        managerMotor.state = MMOT_STATE_START_MOTORS;
    }
}

bool ManagerMotor_IsWaitingSecurity()
{
    if (managerMotor.state == MMOT_STATE_WAITING_SECURITY)
    {
        return true;
    }
    return false;
}

void ManagerMotor_VerifyMotorsConnection()
{
    bool verifM1 = true;
    bool verifM2 = true;
    bool verifM3 = true;

#ifndef MMOT_DEV_MOTOR_1_DISABLE
    if (HAL_GetTick() - motors[MMOT_MOTOR_1].lastMsgTime > MMOT_MAX_MSG_DELAY)
    {
        ManagerMotor_SetMotorError(MMOT_MOTOR_1);
        verifM1 = false;
    }
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE
    if (HAL_GetTick() - motors[MMOT_MOTOR_2].lastMsgTime > MMOT_MAX_MSG_DELAY)
    {
        ManagerMotor_SetMotorError(MMOT_MOTOR_2);
        verifM2 = false;
    }
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE
    if (HAL_GetTick() - motors[MMOT_MOTOR_3].lastMsgTime > MMOT_MAX_MSG_DELAY)
    {
        ManagerMotor_SetMotorError(MMOT_MOTOR_3);
        verifM3 = false;
    }
#endif

    if (!verifM1 || !verifM2 || !verifM3)
    {
        managerMotor.state     = MMOT_STATE_ERROR;
        managerMotor.errorCode = ERROR_CAN_MAX_MSG_DELAY;
        ManagerError_SetError(ERROR_15_MMOT_CAN_MAX_DELAY);
    }
}

void ManagerMotor_VerifyMotorsState()
{
    bool verifM1 = true;
    bool verifM2 = true;
    bool verifM3 = true;

#ifndef MMOT_DEV_MOTOR_1_DISABLE
    verifM1 = ManagerMotor_VerifyMotorState(MMOT_MOTOR_1);
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE
    verifM2 = ManagerMotor_VerifyMotorState(MMOT_MOTOR_2);
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE
    verifM3 = ManagerMotor_VerifyMotorState(MMOT_MOTOR_3);
#endif

    if (!verifM1 || !verifM2 || !verifM3)
    {
        managerMotor.state     = MMOT_STATE_ERROR;
        managerMotor.errorCode = ERROR_MOTOR_MINMAX;
    }
}

bool ManagerMotor_VerifyMotorState(uint8_t motorIndex)
{
    bool verif = true;

    if (managerMotor.state == MMOT_STATE_READY2MOVE)
    {
        if (motors[motorIndex].motor.velocity > MMOT_MOVING_MAX_SPEED ||
            motors[motorIndex].motor.velocity < -MMOT_MOVING_MAX_SPEED)
        {
            ManagerError_SetError(ERROR_22_MMOT_MINMAX_SPEED);
            ManagerMotor_SetMotorError(motorIndex);
            verif = false;
        }

        if (motors[motorIndex].motor.torque > MMOT_MOVING_MAX_TORQUE ||
            motors[motorIndex].motor.torque < -MMOT_MOVING_MAX_TORQUE)
        {
            ManagerError_SetError(ERROR_21_MMOT_MINMAX_TORQUE);
            ManagerMotor_SetMotorError(motorIndex);
            verif = false;
        }

        if (motors[motorIndex].motor.position > motorsMaxPos[motorIndex] ||
            motors[motorIndex].motor.position < motorsMinPos[motorIndex])
        {
            ManagerError_SetError(ERROR_20_MMOT_MINMAX_POS);
            ManagerMotor_SetMotorError(motorIndex);
            verif = false;
        }
    }

    else
    {
        if (motors[motorIndex].motor.velocity > MMOT_IDLE_MAX_SPEED ||
            motors[motorIndex].motor.velocity < -MMOT_IDLE_MAX_SPEED)
        {
            ManagerError_SetError(ERROR_22_MMOT_MINMAX_SPEED);
            ManagerMotor_SetMotorError(motorIndex);
            verif = false;
        }

        if (motors[motorIndex].motor.torque > MMOT_IDLE_MAX_TORQUE ||
            motors[motorIndex].motor.torque < -MMOT_IDLE_MAX_TORQUE)
        {
            ManagerError_SetError(ERROR_21_MMOT_MINMAX_TORQUE);
            ManagerMotor_SetMotorError(motorIndex);
            verif = false;
        }
    }

    return verif;
}

void ManagerMotor_SecurityPassed()
{
    managerMotor.securityPass = true;
}

void ManagerMotor_DisableMotors()
{
#ifndef MMOT_DEV_MOTOR_1_DISABLE
    PeriphMotors_Disable(&motors[MMOT_MOTOR_1].motor);
#endif
#ifndef MMOT_DEV_MOTOR_2_DISABLE
    PeriphMotors_Disable(&motors[MMOT_MOTOR_2].motor);
#endif
#ifndef MMOT_DEV_MOTOR_3_DISABLE
    PeriphMotors_Disable(&motors[MMOT_MOTOR_3].motor);
#endif
}

/********************************************
 * Manager motor state
 ********************************************/
bool ManagerMotor_IsReady2Move()
{
    if (managerMotor.state == MMOT_STATE_READY2MOVE)
    {
        return true;
    }
    return false;
}

void ManagerMotor_SetError()
{
    managerMotor.state = MMOT_STATE_ERROR;
}

bool ManagerMotor_InError()
{
    if (managerMotor.state == MMOT_STATE_ERROR)
    {
        return true;
    }
    return false;
}

uint8_t ManagerMotor_GetState()
{
    return managerMotor.state;
}

void ManagerMotor_StopManualMovement(uint8_t motorindex)
{
    motors[motorindex].goalReady = false;
}

/********************************************
 * Origin shift
 ********************************************/

void ManagerMotor_ApplyOriginShift(uint8_t motorIndex)
{
    motors[motorIndex].motor.position -= motors[motorIndex].originShift;
}

void ManagerMotor_SetOriginShift(uint8_t motorIndex, float shiftValue)
{
    motors[motorIndex].originShift = shiftValue;
}

void ManagerMotor_CalculNextKp(uint8_t motorIndex)
{
    if (motors[motorIndex].motor.torque >= torqueMaxKp)
    {
        motors[motorIndex].kp = 500.0;
    }
    else if (motors[motorIndex].motor.torque <= torqueMinKp)
    {
        motors[motorIndex].kp = 200.0;
    }
    else
    {
        motors[motorIndex].kp =
            200.0 + (motors[motorIndex].motor.torque - torqueMinKp) *
                        (500.0 - 200.0) / (torqueMaxKp - torqueMinKp);
    }
}
