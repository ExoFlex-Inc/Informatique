#include <Manager_Motor.h>
#include <Periph_Canbus.h>

#define MOTOR_1_CAN_ID 1
#define MOTOR_2_CAN_ID 2
#define MOTOR_3_CAN_ID 3

// Error Codes
#define SET_ORIGINES_MOTORS_ERROR   -1
#define CAN_CONNECTION_MOTORS_ERROR -2

#define TIMER   10
#define MAX_TRY 50  // 500 ms before flagging an error

#define MOTOR_STEP   0.01
#define POSITION_TOL 0.02

typedef struct
{
    Motor motor;
    float nextPosition;
    float goalPosition;
    float kp;
    float kd;
    bool  detected;
    bool  goalReady;
} MotorControl;

typedef struct
{
    uint8_t state;
    int8_t  errorCode;

} managerMotor_t;

static uint8_t  tryCount = 0;
static uint32_t timerMs  = 0;

MotorControl motors[MOTOR_NBR];
uint8_t      data[8];

managerMotor_t managerMotor;

// Prototypes
void   ManagerMotor_ReceiveFromMotors();
void   ManagerMotor_EnableMotors();
void   ManagerMotor_ResetMotors();
void   ManagerMotor_CANVerif();
void   ManagerMotor_SetOrigines();
void   ManagerMotor_SendToMotors();
void   ManagerMotor_CalculateNextPositions();
int8_t ManagerMotor_GetMotorDirection(uint8_t motorIndex);
void   ManagerMotor_MotorIncrement(uint8_t motorIndex, int8_t direction);

void ManagerMotor_Init()
{
    // InitCanBus
    PeriphCanbus_Init();
    PeriphMotors_Init(PeriphCanbus_TransmitDLC8);
    HAL_Delay(50);

    // Init motors
    PeriphMotors_InitMotor(&motors[MOTOR_1].motor, MOTOR_1_CAN_ID,
                           MOTOR_AK10_9);
    PeriphMotors_InitMotor(&motors[MOTOR_2].motor, MOTOR_2_CAN_ID,
                           MOTOR_AK10_9);
    PeriphMotors_InitMotor(&motors[MOTOR_3].motor, MOTOR_3_CAN_ID,
                           MOTOR_AK80_64);
    HAL_Delay(50);
    ManagerMotor_EnableMotors();
    ManagerMotor_ResetMotors();

    // Init motor control info
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        motors[i].nextPosition = 0.0;
        motors[i].goalPosition = 0.0;
        motors[i].detected     = false;
        // TODO : should be set to false, and then to true when motor is
        // initilized
        motors[i].goalReady = false;
    }

    // Set Kp Kd
    // AK 10-9
    motors[MOTOR_1].kp = 100.0f;
    motors[MOTOR_1].kd = 5.0f;
    motors[MOTOR_2].kp = 100.0f;
    motors[MOTOR_2].kd = 5.0f;
    // AK 80-64
    motors[MOTOR_3].kp = 100.0f;
    motors[MOTOR_3].kd = 5.0f;

    // Init Data for canBus messages
    for (uint8_t i = 0; i < 8; i++)
    {
        data[i] = 0;
    }

    // Init State machine
    managerMotor.state = CAN_VERIF;
}

void ManagerMotor_Task()
{
    // State machine that Init, sets to zero, reads informations and sends
    // informations to the motors
    if (HAL_GetTick() - timerMs >= TIMER)
    {
        ManagerMotor_ReceiveFromMotors();
        switch (managerMotor.state)
        {
        case CAN_VERIF:
            ManagerMotor_CANVerif();

            // TODO: put conditions to change state here
            break;

        case SET_ORIGIN:
            ManagerMotor_SetOrigines();

            // TODO: put conditions to change state here
            break;

        case READY2MOVE:
            ManagerMotor_CalculateNextPositions();
            ManagerMotor_SendToMotors();

            // TODO: put conditions to change state here
            break;

        case ERROR:
            // Send error value to HMI ?

            // TODO: put conditions to change state here
            break;
        }
        timerMs = HAL_GetTick();
    }
}

void ManagerMotor_EnableMotors()
{
    PeriphMotors_Enable(&motors[MOTOR_1].motor);
    PeriphMotors_Enable(&motors[MOTOR_2].motor);
    PeriphMotors_Enable(&motors[MOTOR_3].motor);
}

void ManagerMotor_ResetMotors()
{
    PeriphMotors_Move(&motors[MOTOR_1].motor, 0, 0, 0, 0, 0);
    PeriphMotors_Move(&motors[MOTOR_2].motor, 0, 0, 0, 0, 0);
    PeriphMotors_Move(&motors[MOTOR_3].motor, 0, 0, 0, 0, 0);
}

void ManagerMotor_ReceiveFromMotors()
{
    if (PeriphCanbus_GetNodeMsg(motors[MOTOR_1].motor.id, data) &&
        data[0] != '\0')
    {
        PeriphMotors_ParseMotorState(&motors[MOTOR_1].motor, data);
        motors[MOTOR_1].detected = true;
        // TODO : check if motor has reached position, if so, motor is ready
    }

    if (PeriphCanbus_GetNodeMsg(motors[MOTOR_2].motor.id, data) &&
        data[0] != '\0')
    {
        PeriphMotors_ParseMotorState(&motors[MOTOR_2].motor, data);
        motors[MOTOR_2].detected = true;
        // TODO : check if motor has reached position, if so, motor is ready
    }

    if (PeriphCanbus_GetNodeMsg(motors[MOTOR_3].motor.id, data) &&
        data[0] != '\0')
    {
        PeriphMotors_ParseMotorState(&motors[MOTOR_3].motor, data);
        motors[MOTOR_3].detected = true;
        // TODO : check if motor has reached position, if so, motor is ready
    }
}

void ManagerMotor_CANVerif()
{
    if (motors[MOTOR_1].detected && motors[MOTOR_2].detected &&
        motors[MOTOR_3].detected)
    {
        managerMotor.state = SET_ORIGIN;
        tryCount           = 0;
    }
    else if (tryCount < MAX_TRY)
    {
        ManagerMotor_EnableMotors();
        ManagerMotor_ResetMotors();

        tryCount += 1;
    }
    else
    {
        managerMotor.state     = ERROR;
        managerMotor.errorCode = CAN_CONNECTION_MOTORS_ERROR;
    }
}

void ManagerMotor_SetOrigines()
{
    if (motors[MOTOR_1].motor.position <= 0.001 &&
        motors[MOTOR_1].motor.position >= -0.001 &&
        motors[MOTOR_2].motor.position <= 0.001 &&
        motors[MOTOR_2].motor.position >= -0.001 &&
        motors[MOTOR_3].motor.position <= 0.001 &&
        motors[MOTOR_3].motor.position >= -0.001)
    {
        managerMotor.state = READY2MOVE;
        tryCount           = 0;
    }
    else if (tryCount < MAX_TRY)
    {
        PeriphMotors_SetZeroPosition(&motors[MOTOR_1].motor);
        PeriphMotors_SetZeroPosition(&motors[MOTOR_2].motor);
        PeriphMotors_SetZeroPosition(&motors[MOTOR_3].motor);

        tryCount += 1;
    }
    else
    {
        managerMotor.state     = ERROR;
        managerMotor.errorCode = SET_ORIGINES_MOTORS_ERROR;
    }
}

void ManagerMotor_SendToMotors()
{
    for (uint8_t i = 0; i < MOTOR_NBR; i++)
    {
        PeriphMotors_Move(&motors[i].motor, motors[i].nextPosition, 0, 0,
                          motors[i].kp, motors[i].kd);
    }
}

void ManagerMotor_SetMotorGoal(uint8_t motorIndex, float goal)
{
    motors[motorIndex].goalPosition = goal;
}

Motor* ManagerMotor_GetMotorData(uint8_t motorIndex)
{
    return &motors[motorIndex].motor;
}

bool ManagerMotor_IsGoalStateReady(uint8_t motorIndex)
{
    return motors[motorIndex]
        .goalReady;  // motor is ready when it has reached it's command
}

void ManagerMotor_CalculateNextPositions()
{
    if (fabsf(motors[MOTOR_1].motor.position - motors[MOTOR_1].goalPosition) >
            POSITION_TOL &&
        motors[MOTOR_1].goalReady)
    {
        ManagerMotor_MotorIncrement(MOTOR_1,
                                    ManagerMotor_GetMotorDirection(MOTOR_1));
    }
    else
    {
        motors[MOTOR_1].goalReady    = false;  // Motor reached his goal
        motors[MOTOR_1].goalPosition = motors[MOTOR_1].motor.position;
    }

    if (fabsf(motors[MOTOR_2].motor.position - motors[MOTOR_2].goalPosition) >
            POSITION_TOL &&
        motors[MOTOR_2].goalReady)
    {
        ManagerMotor_MotorIncrement(MOTOR_2,
                                    ManagerMotor_GetMotorDirection(MOTOR_2));
    }
    else
    {
        motors[MOTOR_2].goalReady    = false;
        motors[MOTOR_2].goalPosition = motors[MOTOR_2].motor.position;
    }

    if (fabsf(motors[MOTOR_3].motor.position - motors[MOTOR_3].goalPosition) >
            POSITION_TOL &&
        motors[MOTOR_3].goalReady)
    {
        ManagerMotor_MotorIncrement(MOTOR_3,
                                    ManagerMotor_GetMotorDirection(MOTOR_3));
    }
    else
    {
        motors[MOTOR_3].goalReady    = false;
        motors[MOTOR_3].goalPosition = motors[MOTOR_3].motor.position;
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
    motors[motorIndex].nextPosition += direction * MOTOR_STEP;
}

uint8_t ManagerMotor_GetState()
{
    return managerMotor.state;
}

void ManagerMotor_SetMotorGoalState(uint8_t motorIndex, bool readyState)
{
    motors[motorIndex].goalReady = readyState;
}
