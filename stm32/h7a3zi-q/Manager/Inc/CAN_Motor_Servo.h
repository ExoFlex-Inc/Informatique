// CAN_Motor_Servo.h

#ifndef CAN_MOTOR_SERVO_H
#define CAN_MOTOR_SERVO_H

#include <stdint.h>

#include "stm32h7xx_hal.h"
#include "stm32h7xx_hal_fdcan.h"

typedef enum
{
    CAN_PACKET_SET_DUTY = 0,  // Duty cycle mode
    CAN_PACKET_SET_CURRENT,  // Current loop mode
    CAN_PACKET_SET_CURRENT_BRAKE,  // Current brake mode
    CAN_PACKET_SET_RPM,  // Velocity mode
    CAN_PACKET_SET_POS,  // Position mode
    CAN_PACKET_SET_ORIGIN_HERE,  // Set origin mode
    CAN_PACKET_POS_SPD  // Position velocity loop mode
} CAN_PACKET_ID;

extern FDCAN_HandleTypeDef   hfdcan1;
extern FDCAN_TxHeaderTypeDef TxHeader;
extern FDCAN_RxHeaderTypeDef RxHeader;

extern uint8_t TxData[8];
extern uint8_t RxData[8];

extern uint32_t TxMailbox;

extern float p_in;

void HAL_FDCAN_RxFifo0Callback(FDCAN_HandleTypeDef* hfdcan, uint32_t RxFifo0ITs);
void buffer_append_int16(uint8_t* buffer, int16_t number, int16_t* index);
void buffer_append_int32(uint8_t* buffer, int32_t number, int32_t* index);
void comm_can_transmit_eid(uint32_t id, const uint8_t* data, uint32_t bytes);
void motor_receive(float* motor_pos, float* motor_spd, float* motor_cur,
                   uint8_t* motor_temp, uint8_t* motor_error);
void comm_can_set_origin(uint8_t controller_id);
void comm_can_set_pos(uint8_t controller_id, float pos);
void comm_can_set_pos_spd(uint8_t controller_id, float pos, int16_t spd,
                          int16_t RPA);

#endif  // CAN_MOTOR_SERVO_H
