#include "Periph_Motors.h"

int32_t PeriphMotors_ConvFloatToUint(float val, float min, float max,
                                     uint8_t bits);
float   PeriphMotors_ConvUintToFloat(int32_t val, float min, float max,
                                     uint8_t bits);

float PeriphMotors_SumBuf(float* buf, uint8_t size);

/// @brief AK10-9
// AmpPerNm = 1/R/Kt/expermientalFactor = 1/9/0.16/18 = 0.0385 A/Nm
const MotorParameters ak10_9 = {-12.5, 12.5, -50, 50,     -65, 65, 0,
                                500,   0,    5,   0.0385, 1,   0};

/// @brief AK80-64 (AK80-80/64)
// AmpPerNm = 1/R/Kt/expermientalFactor = 1/64/0.119/???(18) = ???(0.0073) A/Nm
const MotorParameters ak80_64 = {-12.5, 12.5, -8, 8,      -144, 144, 0,
                                 500,   0,    5,  0.0073, 1,    0};

SendCanDataFunction PeriphMotors_SendCanData;

void PeriphMotors_Init(SendCanDataFunction sendCanFunc)
{
    PeriphMotors_SendCanData = sendCanFunc;
}

bool PeriphMotors_InitMotor(Motor* pMotor, uint8_t id, uint8_t model,
                            float ratio)
{
    pMotor->id = id;

    if (model == MOTOR_AK10_9)
    {
        pMotor->parameters = ak10_9;
    }
    else if (model == MOTOR_AK80_64)
    {
        pMotor->parameters = ak80_64;
    }
    else
    {
        return false;
    }

    pMotor->parameters.ratio = ratio;
    pMotor->temp             = 0;

    pMotor->noiseSmallIndex = 0;
    for (uint8_t i = 0; i < NOISE_SMALL_BUF_SIZE; i++)
    {
        pMotor->posBuf[i] = 0;
    }

    pMotor->noiseBigIndex = 0;
    for (uint8_t i = 0; i < NOISE_BIG_BUF_SIZE; i++)
    {
        pMotor->velBuf[i] = 0;
        pMotor->torBuf[i] = 0;
    }

    PeriphMotors_Move(pMotor, 0, 0, 0, 0, 0);
    PeriphMotors_Disable(pMotor);

    return true;
}

void PeriphMotors_Enable(Motor* pMotor)
{
    uint8_t data[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC};
    PeriphMotors_SendCanData(pMotor->id, data);
}

void PeriphMotors_SubscribeToRx(Motor* pMotor)
{
    uint8_t data[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC};
    PeriphMotors_SendCanData(pMotor->id, data);
}

void PeriphMotors_Disable(Motor* pMotor)
{
    uint8_t data[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFD};
    PeriphMotors_SendCanData(pMotor->id, data);
}

void PeriphMotors_SetZeroPosition(Motor* pMotor)
{
    uint8_t data[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE};
    PeriphMotors_SendCanData(pMotor->id, data);
}

void PeriphMotors_SoftwareOrigin(Motor* pMotor)
{
    pMotor->parameters.offset += pMotor->position;
    pMotor->position = 0;

    // Reset position noise buf
    for (uint8_t i = 0; i < NOISE_SMALL_BUF_SIZE; i++)
    {
        pMotor->posBuf[i] = 0;
    }
}

bool PeriphMotors_IsSoftwareOrigin(Motor* pMotor)
{
    if (pMotor->parameters.offset != 0)
    {
        return true;
    }
    else
    {
        return false;
    }
}

void PeriphMotors_Move(Motor* pMotor, float position, float velocity,
                       float torque, float kp, float kd)
{
    // Apply offset
    position = position + pMotor->parameters.offset;

    // Apply ratio
    position *= pMotor->parameters.ratio;
    velocity *= pMotor->parameters.ratio;
    torque /= pMotor->parameters.ratio;

    int32_t pInt =
        PeriphMotors_ConvFloatToUint(position, pMotor->parameters.positionMin,
                                     pMotor->parameters.positionMax, 16);
    int32_t vInt =
        PeriphMotors_ConvFloatToUint(velocity, pMotor->parameters.velocityMin,
                                     pMotor->parameters.velocityMax, 12);
    int32_t tInt = PeriphMotors_ConvFloatToUint(
        torque, pMotor->parameters.torqueMin, pMotor->parameters.torqueMax, 12);
    int32_t kpInt = PeriphMotors_ConvFloatToUint(kp, pMotor->parameters.kpMin,
                                                 pMotor->parameters.kpMax, 12);
    int32_t kdInt = PeriphMotors_ConvFloatToUint(kd, pMotor->parameters.kdMin,
                                                 pMotor->parameters.kdMax, 12);

    uint8_t data[8];
    data[0] = pInt >> 8;
    data[1] = pInt & 0xFF;
    data[2] = vInt >> 4;
    data[3] = ((vInt & 0xF) << 4 | (kpInt >> 8));
    data[4] = kpInt & 0xFF;
    data[5] = kdInt >> 4;
    data[6] = ((kdInt & 0xF) << 4 | (tInt >> 8));
    data[7] = tInt & 0xFF;

    PeriphMotors_SendCanData(pMotor->id, data);
}

void PeriphMotors_ParseMotorState(Motor* pMotor, uint8_t* canData)
{
    uint16_t pInt = (canData[1] << 8) | canData[2];
    uint16_t vInt = (canData[3] << 4) | (canData[4] >> 4);
    uint16_t tInt = ((canData[4] & 0xF) << 8) | canData[5];

    float position =
        PeriphMotors_ConvUintToFloat(pInt, pMotor->parameters.positionMin,
                                     pMotor->parameters.positionMax, 16);
    float velocity =
        PeriphMotors_ConvUintToFloat(vInt, pMotor->parameters.velocityMin,
                                     pMotor->parameters.velocityMax, 12);
    float torque = PeriphMotors_ConvUintToFloat(
        tInt, -pMotor->parameters.torqueMax, pMotor->parameters.torqueMax, 12);

    // Apply ratio
    position = position / pMotor->parameters.ratio;
    velocity = velocity / pMotor->parameters.ratio;
    torque   = torque * pMotor->parameters.ratio;

    // Apply offset
    position = position - pMotor->parameters.offset;

    // Add data to noise buffer
    pMotor->posBuf[pMotor->noiseSmallIndex] = position;
    pMotor->velBuf[pMotor->noiseBigIndex]   = velocity;
    pMotor->torBuf[pMotor->noiseBigIndex]   = torque;

    pMotor->noiseSmallIndex += 1;
    if (pMotor->noiseSmallIndex >= NOISE_SMALL_BUF_SIZE)
    {
        pMotor->noiseSmallIndex = 0;
    }

    pMotor->noiseBigIndex += 1;
    if (pMotor->noiseBigIndex >= NOISE_BIG_BUF_SIZE)
    {
        pMotor->noiseBigIndex = 0;
    }

    // Get noise parsed data
    pMotor->position =
        position;  // PeriphMotors_SumBuf(pMotor->posBuf, NOISE_SMALL_BUF_SIZE);
                   // //No filtering on position to stay realtime
    pMotor->velocity = PeriphMotors_SumBuf(pMotor->velBuf, NOISE_BIG_BUF_SIZE);
    pMotor->torque   = PeriphMotors_SumBuf(pMotor->torBuf, NOISE_BIG_BUF_SIZE);

    float current = pMotor->torque * pMotor->parameters.AmpPerNm;
    if (current < 0)
    {
        current *= -1;
    }
    pMotor->current = current;

    pMotor->temp = canData[6] - 40;
}

float PeriphMotors_SumBuf(float* buf, uint8_t size)
{
    float sum = 0;
    for (uint8_t i = 0; i < size; i++)
    {
        sum += buf[i];
    }

    return sum / size;
}

int32_t PeriphMotors_ConvFloatToUint(float val, float min, float max,
                                     uint8_t bits)
{
    /* Limits. */
    if (val > max)
    {
        val = max;
    }
    else if (val < min)
    {
        val = min;
    }

    float span = max - min;
    return (int32_t) ((val - min) * ((float) ((1 << bits) - 1)) / span);
}

float PeriphMotors_ConvUintToFloat(int32_t val, float min, float max,
                                   uint8_t bits)
{
    float span = max - min;
    return ((float) val) * span / ((float) ((1 << bits) - 1)) + min;
}
