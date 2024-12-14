#include <Manager_Error.h>
#include <Manager_Motor.h>
#include <Periph_Canbus.h>

#define MMOT_MOTOR_1_CAN_ID 2
#define MMOT_MOTOR_2_CAN_ID 1
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

#define MMOT_MAX_TEMP 60

// Error Codes
#define ERROR_SET_ORIGINES_MOTORS   -1
#define ERROR_CAN_CONNECTION_MOTORS -2
#define ERROR_CAN_MAX_MSG_DELAY     -3
#define ERROR_MOTOR_MINMAX          -4
#define ERROR_MOTOR_TEMP            -5

#define MMOT_DT_MS 10.0f
#define MMOT_DT_S  MMOT_DT_MS / 1000.0f
#define MAX_TRY    50  // 500 ms before flagging an error

#define MOTOR_STEP   0.005
#define MOTOR3_STEP  0.002
#define GOAL_POS_TOL 0.01

#define MMOT_MAX_MSG_DELAY 30

#define MMOT_INIT_IDLE          0
#define MMOT_INIT_START         1
#define MMOT_INIT_START_OK      2
#define MMOT_INIT_DISABLEMOV    3
#define MMOT_INIT_DISABLEMOV_OK 4
#define MMOT_INIT_ORIGIN        5
#define MMOT_INIT_OK            6
#define MMOT_INIT_ERROR         7

#define MMOT_CONTROL_POS_OLD          0
#define MMOT_CONTROL_SPEED            1
#define MMOT_CONTROL_POS_SPEED        2
#define MMOT_CONTROL_POS_SPEED_TORQUE 3

#define MMOT_MOTOR1_ACC 1.0f
#define MMOT_MOTOR2_ACC 1.0f
#define MMOT_MOTOR3_ACC 0.1f

#define MMOT_MIN_SPEED_CMD  0.05
#define MMOT_MAX_SPEED_CMD  2
#define MMOT_MAX_TORQUE_CMD 20

#define MMOT_GR_HOME_OFFSET -3.14 / 2  // 90 deg in rad
#define MMOT_GR_L           0.3  // m
#define MMOT_GR_M           5  // kg
#define MMOT_GR_G           9.81  // m/s2

typedef struct
{
    Motor motor;

    uint8_t initState;
    uint8_t initTry;
    bool    detected;

    uint8_t controlType;
    bool    goalReady;
    float   goalPosition;
    float   goalSpeed;
    float   minSpeed;
    float   goalTorque;
    float   cmdPosition;
    float   cmdSpeed;
    float   cmdTorque;
    float   kp;
    float   kd;

    uint32_t lastMsgTime;
    float    originShift;
} MotorControl;

typedef struct
{
    uint8_t state;
    int8_t  errorCode;
    bool    reset;
    bool    securityPass;
    bool    setupFirstPass;
    float   acc[MMOT_MOTOR_NBR];

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
void ManagerMotor_StartMotor(uint8_t id);

void  ManagerMotor_NextCmd();
void  ManagerMotor_NextCmdPosOld(uint8_t id);
void  ManagerMotor_NextCmdSpeed(uint8_t id);
void  ManagerMotor_NextCmdPosSpeed(uint8_t id);
void  ManagerMotor_NextCmdPosSpeedTorque(uint8_t id);
float ManagerMotor_CalcSpeedFromTorque(float torque, float torqueGoal,
                                       float wMin, float wMax);
float ManagerMotor_CalcGravityCompensation();

void ManagerMotor_SendToMotors();
void ManagerMotor_DisableMotors();
void ManagerMotor_DisableMotorsMovement();

void ManagerMotor_VerifyMotorsConnection();
void ManagerMotor_VerifyMotorsState();
bool ManagerMotor_VerifyMotorState(uint8_t id);
void ManagerMotor_VerifyMotorsTemp();
bool ManagerMotor_VerifyMotorTemp(uint8_t id);

void   ManagerMotor_ApplyOriginShift(uint8_t id);
int8_t ManagerMotor_GetMotorDirection(uint8_t id);
void   ManagerMotor_CalculNextKp(uint8_t id);

void ManagerMotor_SetMotorError(uint8_t id);

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
                           MOTOR_AK10_9, -1);
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE
    PeriphMotors_InitMotor(&motors[MMOT_MOTOR_2].motor, MMOT_MOTOR_2_CAN_ID,
                           MOTOR_AK10_9, 1);
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE
    PeriphMotors_InitMotor(&motors[MMOT_MOTOR_3].motor, MMOT_MOTOR_3_CAN_ID,
                           MOTOR_AK80_64, 1);
#endif

    // Init motor control info
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        motors[i].initState = MMOT_INIT_IDLE;
        motors[i].initTry   = 0;
        motors[i].detected  = false;

        motors[i].controlType  = MMOT_CONTROL_POS_SPEED;
        motors[i].goalPosition = 0.0;
        motors[i].goalSpeed    = 0.0;
        motors[i].minSpeed     = 0.0;
        motors[i].goalTorque   = 0.0;
        motors[i].cmdPosition  = 0.0;
        motors[i].cmdSpeed     = 0.0;
        motors[i].cmdTorque    = 0.0;

        motors[i].goalReady   = false;
        motors[i].lastMsgTime = 0;
        motors[i].originShift = 0.0f;
    }

    // Set Kp Kd
    // AK 10-9
    motors[MMOT_MOTOR_1].kp = 500.0f;
    motors[MMOT_MOTOR_1].kd = 5.0f;
    motors[MMOT_MOTOR_2].kp = 500.0f;
    motors[MMOT_MOTOR_2].kd = 5.0f;
    // AK 80-64
    motors[MMOT_MOTOR_3].kp = 500.0f;
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

    managerMotor.acc[MMOT_MOTOR_1] = MMOT_MOTOR1_ACC;
    managerMotor.acc[MMOT_MOTOR_2] = MMOT_MOTOR2_ACC;
    managerMotor.acc[MMOT_MOTOR_3] = MMOT_MOTOR3_ACC;

    torqueMaxKp = 10.0;
    torqueMinKp = 3.0;
}

void ManagerMotor_Task()
{
    // State machine that Init, sets to zero, reads informations and sends
    // informations to the motors
    ManagerMotor_ReceiveFromMotors();
    ManagerMotor_VerifyMotorsState();

    if (HAL_GetTick() - timerMs >= MMOT_DT_MS)
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
            ManagerMotor_NextCmd();
            ManagerMotor_SendToMotors();
            ManagerMotor_VerifyMotorsConnection();

            break;

        case MMOT_STATE_ERROR:
            ManagerMotor_DisableMotorsMovement();
            break;
        }

        ManagerMotor_VerifyMotorsTemp();
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

void ManagerMotor_StartMotor(uint8_t id)
{
    switch (motors[id].initState)
    {
    case MMOT_INIT_IDLE:
        motors[id].detected  = false;
        motors[id].initTry   = 0;
        motors[id].initState = MMOT_INIT_START;

        break;
    case MMOT_INIT_START:

        if (motors[id].detected)
        {
            motors[id].initState = MMOT_INIT_START_OK;
        }
        else if (motors[id].initTry < MAX_TRY)
        {
            PeriphMotors_Enable(&motors[id].motor);
            motors[id].initTry += 1;
        }
        else
        {
            motors[id].initState   = MMOT_INIT_ERROR;
            managerMotor.state     = MMOT_STATE_ERROR;
            managerMotor.errorCode = ERROR_CAN_CONNECTION_MOTORS;
            ManagerError_SetError(ERROR_14_MMOT_CAN_CONNECT);
            ManagerMotor_SetMotorError(id);
        }

        break;

    case MMOT_INIT_START_OK:
        motors[id].detected  = false;
        motors[id].initTry   = 0;
        motors[id].initState = MMOT_INIT_DISABLEMOV;
        break;

    case MMOT_INIT_DISABLEMOV:
        if (motors[id].detected)
        {
            motors[id].initState = MMOT_INIT_DISABLEMOV_OK;
        }
        else if (motors[id].initTry < MAX_TRY)
        {
            PeriphMotors_Move(&motors[id].motor, 0, 0, 0, 0, 0);
            motors[id].initTry += 1;
        }
        else
        {
            motors[id].initState   = MMOT_INIT_ERROR;
            managerMotor.state     = MMOT_STATE_ERROR;
            managerMotor.errorCode = ERROR_CAN_CONNECTION_MOTORS;
            ManagerError_SetError(ERROR_14_MMOT_CAN_CONNECT);
            ManagerMotor_SetMotorError(id);
        }
        break;

    case MMOT_INIT_DISABLEMOV_OK:
        motors[id].detected  = false;
        motors[id].initTry   = 0;
        motors[id].initState = MMOT_INIT_ORIGIN;
        break;

    case MMOT_INIT_ORIGIN:
        if (motors[id].detected && motors[id].motor.position <= 0.001 &&
            motors[id].motor.position >= -0.001)
        {
            motors[id].initState = MMOT_INIT_OK;
        }
        else if (motors[id].initTry < MAX_TRY)
        {
            PeriphMotors_SetZeroPosition(&motors[id].motor);
            motors[id].initTry += 1;
        }
        else
        {
            motors[id].initState   = MMOT_INIT_ERROR;
            managerMotor.state     = MMOT_STATE_ERROR;
            managerMotor.errorCode = ERROR_SET_ORIGINES_MOTORS;
            ManagerError_SetError(ERROR_16_MMOT_SET_ORIGIN);
            ManagerMotor_SetMotorError(id);
        }
        break;
    }
}

void ManagerMotor_SetMotorError(uint8_t id)
{
    if (id == MMOT_MOTOR_1)
    {
        ManagerError_SetError(ERROR_17_MOTOR_1);
    }
    else if (id == MMOT_MOTOR_2)
    {
        ManagerError_SetError(ERROR_18_MOTOR_2);
    }
    else if (id == MMOT_MOTOR_3)
    {
        ManagerError_SetError(ERROR_19_MOTOR_3);
    }
}

/********************************************
 * Calculate next action and send to motors
 ********************************************/

void ManagerMotor_NextCmd()
{
    for (uint8_t i = 0; i < MMOT_MOTOR_NBR; i++)
    {
        if (motors[i].controlType == MMOT_CONTROL_POS_OLD)
        {
            ManagerMotor_NextCmdPosOld(i);
        }
        else if (motors[i].controlType == MMOT_CONTROL_SPEED)
        {
            ManagerMotor_NextCmdSpeed(i);
        }
        else if (motors[i].controlType == MMOT_CONTROL_POS_SPEED)
        {
            ManagerMotor_NextCmdPosSpeed(i);
        }
        else if (motors[i].controlType == MMOT_CONTROL_POS_SPEED_TORQUE)
        {
            ManagerMotor_NextCmdPosSpeedTorque(i);
        }
    }
}

void ManagerMotor_NextCmdPosOld(uint8_t id)
{
    float posLeft = fabsf(motors[id].motor.position - motors[id].goalPosition);

    if (posLeft > GOAL_POS_TOL && motors[id].goalReady)
    {
        int8_t dir = ManagerMotor_GetMotorDirection(id);
        if (id == MMOT_MOTOR_3)
        {
            motors[id].cmdPosition += dir * MOTOR3_STEP;
        }
        else if (id == MMOT_MOTOR_2)
        {
            motors[id].cmdPosition += dir * MOTOR_STEP;
        }
        else if (id == MMOT_MOTOR_1)
        {
            motors[id].cmdPosition += dir * MOTOR_STEP;
        }
    }
    else
    {
        motors[id].goalReady = false;  // Motor reached his goal
    }
}

void ManagerMotor_NextCmdSpeed(uint8_t id)
{
    motors[id].cmdSpeed = motors[id].goalSpeed;
    motors[id].cmdPosition =
        motors[id].cmdPosition + motors[id].cmdSpeed * MMOT_DT_S;
}

void ManagerMotor_NextCmdPosSpeed(uint8_t id)
{
    // Get the remaining distance to the goal
    float posLeft = fabsf(motors[id].motor.position - motors[id].goalPosition);

    // Motor is not at goal
    if (posLeft > GOAL_POS_TOL && motors[id].goalReady)
    {
        int8_t dir = ManagerMotor_GetMotorDirection(id);

        float add = dir * managerMotor.acc[id] * MMOT_DT_S;

        motors[id].cmdSpeed = motors[id].cmdSpeed + add;

        if (dir == 1 && motors[id].cmdSpeed > dir * motors[id].goalSpeed)
        {
            motors[id].cmdSpeed = dir * motors[id].goalSpeed;
        }
        if (dir == -1 && motors[id].cmdSpeed < dir * motors[id].goalSpeed)
        {
            motors[id].cmdSpeed = dir * motors[id].goalSpeed;
        }

        motors[id].cmdPosition =
            motors[id].cmdPosition + motors[id].cmdSpeed * MMOT_DT_S;

        // Gravity compensation
        if (id == MMOT_MOTOR_3)
        {
            motors[id].cmdTorque = ManagerMotor_CalcGravityCompensation();
        }
    }
    // Motor reached his goal
    else
    {
        motors[id].cmdSpeed  = 0;
        motors[id].goalReady = false;
    }
}

void ManagerMotor_NextCmdPosSpeedTorque(uint8_t id)
{
    // Get the remaining distance to the goal
    float posLeft = fabsf(motors[id].motor.position - motors[id].goalPosition);

    // TODO Handle case when motor is going backwards

    // Motor is not at goal
    if (posLeft > GOAL_POS_TOL && motors[id].goalReady)
    {
        float alpha = 0.9;

        int8_t dir    = ManagerMotor_GetMotorDirection(id);
        float  torque = motors[id].motor.torque;

        if (dir < 0)
        {
            torque = -torque;
        }

        float speedFromTorque = ManagerMotor_CalcSpeedFromTorque(
            torque, fabsf(motors[id].goalTorque), MMOT_MIN_SPEED_CMD,
            motors[id].goalSpeed);

        motors[id].cmdSpeed =
            motors[id].cmdSpeed * alpha + speedFromTorque * dir * (1 - alpha);
        motors[id].cmdPosition =
            motors[id].cmdPosition + motors[id].cmdSpeed * MMOT_DT_S;

        // Gravity compensation
        if (id == MMOT_MOTOR_3)
        {
            motors[id].cmdTorque = ManagerMotor_CalcGravityCompensation();
        }
    }
    // Motor reached his goal
    else
    {
        motors[id].cmdSpeed  = 0;
        motors[id].goalReady = false;
    }
}

// Speed is always calculated as absolute value and needs to be assigned a
// direction afterwards
float ManagerMotor_CalcSpeedFromTorque(float torque, float torqueGoal,
                                       float wMin, float wMax)
{
    if (wMin > wMax)
    {
        ManagerError_SetError(ERROR_2_MMOT);
        managerMotor.state = MMOT_STATE_ERROR;
    }

    float w           = 0;
    float decelFactor = 0.1;

    // Définir les seuils pour 25% et 75%
    float torque25  = 0.65f * torqueGoal;
    float torque75  = 0.95f * torqueGoal;
    float torque110 = 1.05f * torqueGoal;

    // Calculer w en fonction de torque
    if (torque <= torque25)
    {
        w = wMax;
    }
    else if (torque >= torque25 && torque <= torque75)
    {
        // Transition linéaire entre wMin et wMax
        w = wMax - (wMax - wMin) * (torque - torque25) / (torque75 - torque25);
    }
    else if (torque >= torque75 && torque <= torque110)
    {
        w = wMin;
    }
    else
    {
        // Décélération quand torque dépasse torque110
        w = wMin - decelFactor * (torque - torque110);
        if (w < -wMax)
        {
            w = -wMax;
        }
    }

    if (w > wMax)
    {
        ManagerError_SetError(ERROR_2_MMOT);
        managerMotor.state = MMOT_STATE_ERROR;
    }

    return w;
}

float ManagerMotor_CalcGravityCompensation()
{
    // Get angle : check if home or not
    bool  isHomed = PeriphMotors_IsSoftwareOrigin(&motors[MMOT_MOTOR_3].motor);
    float tetha   = 0;

    if (isHomed)
    {
        tetha = MMOT_GR_HOME_OFFSET + motors[MMOT_MOTOR_3].motor.position;
    }
    else
    {
        tetha = motors[MMOT_MOTOR_3].motor.position;
    }

    return MMOT_GR_L * MMOT_GR_M * MMOT_GR_G * tetha;
}

void ManagerMotor_SendToMotors()
{
#ifndef MMOT_DEV_MOTOR_1_DISABLE

    PeriphMotors_Move(
        &motors[MMOT_MOTOR_1].motor, motors[MMOT_MOTOR_1].cmdPosition,
        motors[MMOT_MOTOR_1].cmdSpeed, motors[MMOT_MOTOR_1].cmdTorque,
        motors[MMOT_MOTOR_1].kp, motors[MMOT_MOTOR_1].kd);
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE

    PeriphMotors_Move(
        &motors[MMOT_MOTOR_2].motor, motors[MMOT_MOTOR_2].cmdPosition,
        motors[MMOT_MOTOR_2].cmdSpeed, motors[MMOT_MOTOR_2].cmdTorque,
        motors[MMOT_MOTOR_2].kp, motors[MMOT_MOTOR_2].kd);
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE

    PeriphMotors_Move(
        &motors[MMOT_MOTOR_3].motor, motors[MMOT_MOTOR_3].cmdPosition,
        motors[MMOT_MOTOR_3].cmdSpeed, motors[MMOT_MOTOR_3].cmdTorque,
        motors[MMOT_MOTOR_3].kp, motors[MMOT_MOTOR_3].kd);
#endif
}

/********************************************
 * Goal and movements SET/GET
 ********************************************/

Motor* ManagerMotor_GetMotorData(uint8_t id)
{
    return &motors[id].motor;
}

bool ManagerMotor_IsGoalStateReady(uint8_t id)
{
    return motors[id]
        .goalReady;  // motor is ready when it has reached it's command
}

void ManagerMotor_MovePosOld(uint8_t id, float pos)
{
    motors[id].controlType  = MMOT_CONTROL_POS_OLD;
    motors[id].goalPosition = pos;
    motors[id].goalSpeed    = 0;
    motors[id].goalTorque   = 0;
    motors[id].cmdPosition  = motors[id].motor.position;
    motors[id].cmdSpeed     = motors[id].motor.velocity;
    motors[id].cmdTorque    = 0;
    motors[id].goalReady    = true;
}

void ManagerMotor_MoveSpeed(uint8_t id, float speed)
{
    if (speed > MMOT_MAX_SPEED_CMD)
    {
        speed = MMOT_MAX_SPEED_CMD;
    }
    else if (speed < -MMOT_MAX_SPEED_CMD)
    {
        speed = -MMOT_MAX_SPEED_CMD;
    }

    motors[id].controlType  = MMOT_CONTROL_SPEED;
    motors[id].goalPosition = 0;
    motors[id].goalSpeed    = speed;
    motors[id].goalTorque   = 0;
    motors[id].cmdPosition  = motors[id].motor.position;
    motors[id].cmdSpeed     = 0;
    motors[id].cmdTorque    = 0;
}

void ManagerMotor_MovePosSpeed(uint8_t id, float pos, float speed)
{
    if (fabsf(speed) > MMOT_MAX_SPEED_CMD)
    {
        speed = MMOT_MAX_SPEED_CMD;
    }

    motors[id].controlType  = MMOT_CONTROL_POS_SPEED;
    motors[id].goalPosition = pos;
    motors[id].goalSpeed    = fabsf(speed);
    motors[id].goalTorque   = 0;
    motors[id].cmdPosition  = motors[id].motor.position;
    motors[id].cmdSpeed     = 0;
    motors[id].cmdTorque    = 0;
    motors[id].goalReady    = true;
}

void ManagerMotor_MovePosSpeedTorque(uint8_t id, float pos, float minSpeed,
                                     float maxSpeed, float torque)
{
    if (fabsf(maxSpeed) > MMOT_MAX_SPEED_CMD)
    {
        maxSpeed = MMOT_MAX_SPEED_CMD;
    }

    if (fabsf(torque) > MMOT_MAX_TORQUE_CMD)
    {
        torque = MMOT_MAX_TORQUE_CMD;
    }

    motors[id].controlType  = MMOT_CONTROL_POS_SPEED_TORQUE;
    motors[id].goalPosition = pos;
    motors[id].goalSpeed    = fabsf(maxSpeed);
    motors[id].minSpeed     = fabsf(minSpeed);
    motors[id].goalTorque   = fabsf(torque);
    motors[id].cmdPosition  = motors[id].motor.position;
    motors[id].cmdSpeed     = motors[id].motor.velocity;
    motors[id].cmdTorque    = 0;
    motors[id].goalReady    = true;
}

int8_t ManagerMotor_GetMotorDirection(uint8_t id)
{
    if (motors[id].goalPosition < motors[id].motor.position)
    {
        return -1;
    }
    else
    {
        return 1;
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

bool ManagerMotor_VerifyMotorState(uint8_t id)
{
    bool verif = true;

    if (managerMotor.state == MMOT_STATE_READY2MOVE)
    {
        if (motors[id].motor.velocity > MMOT_MOVING_MAX_SPEED ||
            motors[id].motor.velocity < -MMOT_MOVING_MAX_SPEED)
        {
            ManagerError_SetError(ERROR_22_MMOT_MINMAX_SPEED);
            ManagerMotor_SetMotorError(id);
            verif = false;
        }

        if (motors[id].motor.torque > MMOT_MOVING_MAX_TORQUE ||
            motors[id].motor.torque < -MMOT_MOVING_MAX_TORQUE)
        {
            ManagerError_SetError(ERROR_21_MMOT_MINMAX_TORQUE);
            ManagerMotor_SetMotorError(id);
            verif = false;
        }

        if (motors[id].motor.position > motorsMaxPos[id] ||
            motors[id].motor.position < motorsMinPos[id])
        {
            ManagerError_SetError(ERROR_20_MMOT_MINMAX_POS);
            ManagerMotor_SetMotorError(id);
            verif = false;
        }
    }

    else
    {
        if (motors[id].motor.velocity > MMOT_IDLE_MAX_SPEED ||
            motors[id].motor.velocity < -MMOT_IDLE_MAX_SPEED)
        {
            ManagerError_SetError(ERROR_22_MMOT_MINMAX_SPEED);
            ManagerMotor_SetMotorError(id);
            verif = false;
        }

        if (motors[id].motor.torque > MMOT_IDLE_MAX_TORQUE ||
            motors[id].motor.torque < -MMOT_IDLE_MAX_TORQUE)
        {
            ManagerError_SetError(ERROR_21_MMOT_MINMAX_TORQUE);
            ManagerMotor_SetMotorError(id);
            verif = false;
        }
    }

    return verif;
}

void ManagerMotor_VerifyMotorsTemp()
{
    bool verifM1 = true;
    bool verifM2 = true;
    bool verifM3 = true;

#ifndef MMOT_DEV_MOTOR_1_DISABLE
    verifM1 = ManagerMotor_VerifyMotorTemp(MMOT_MOTOR_1);
#endif

#ifndef MMOT_DEV_MOTOR_2_DISABLE
    // verifM2 = ManagerMotor_VerifyMotorTemp(MMOT_MOTOR_2);
    // Sensor is faulty
#endif

#ifndef MMOT_DEV_MOTOR_3_DISABLE
    verifM3 = ManagerMotor_VerifyMotorTemp(MMOT_MOTOR_3);
#endif

    if (!verifM1 || !verifM2 || !verifM3)
    {
        managerMotor.state     = MMOT_STATE_ERROR;
        managerMotor.errorCode = ERROR_MOTOR_TEMP;
    }
}

bool ManagerMotor_VerifyMotorTemp(uint8_t id)
{
    bool verif = true;
    if (motors[id].motor.temp >= MMOT_MAX_TEMP)
    {
        ManagerError_SetError(ERROR_13_MAX_TEMP);
        ManagerMotor_SetMotorError(id);
        verif = false;
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

void ManagerMotor_DisableMotorsMovement()
{
#ifndef MMOT_DEV_MOTOR_1_DISABLE
    PeriphMotors_Move(&motors[MMOT_MOTOR_1].motor, 0, 0, 0, 0, 0);
#endif
#ifndef MMOT_DEV_MOTOR_2_DISABLE
    PeriphMotors_Move(&motors[MMOT_MOTOR_2].motor, 0, 0, 0, 0, 0);
#endif
#ifndef MMOT_DEV_MOTOR_3_DISABLE
    PeriphMotors_Move(&motors[MMOT_MOTOR_3].motor, 0, 0, 0, 0, 0);
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
void ManagerMotor_SoftwareOrigin(uint8_t id)
{
    PeriphMotors_SoftwareOrigin(&motors[id].motor);
    motors[id].cmdPosition = 0;
}

bool ManagerMotor_HasMachineHomed()
{
    bool ret = true;

#ifndef MMOT_DEV_MOTOR_1_DISABLE
    if (!PeriphMotors_IsSoftwareOrigin(&motors[MMOT_MOTOR_1].motor))
    {
        ret = false;
    }
#endif
#ifndef MMOT_DEV_MOTOR_2_DISABLE
    if (!PeriphMotors_IsSoftwareOrigin(&motors[MMOT_MOTOR_2].motor))
    {
        ret = false;
    }
#endif
#ifndef MMOT_DEV_MOTOR_3_DISABLE
    if (!PeriphMotors_IsSoftwareOrigin(&motors[MMOT_MOTOR_3].motor))
    {
        ret = false;
    }
#endif

    return ret;
}

void ManagerMotor_ApplyOriginShift(uint8_t id)
{
    motors[id].motor.position -= motors[id].originShift;
}

void ManagerMotor_SetOriginShift(uint8_t id, float shiftValue)
{
    motors[id].originShift = shiftValue;
    motors[id].cmdPosition -= motors[id].originShift;
}

void ManagerMotor_CalculNextKp(uint8_t id)
{
    if (motors[id].motor.torque >= torqueMaxKp)
    {
        motors[id].kp = 500.0;
    }
    else if (motors[id].motor.torque <= torqueMinKp)
    {
        motors[id].kp = 200.0;
    }
    else
    {
        motors[id].kp = 200.0 + (motors[id].motor.torque - torqueMinKp) *
                                    (500.0 - 200.0) /
                                    (torqueMaxKp - torqueMinKp);
    }
}
