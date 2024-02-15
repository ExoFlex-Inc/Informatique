#ifndef CAN_Motor_Servo_H

#include "main.h"

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

void CanMotorServo_Init();
void CanMotorServo_Receive(float* motor_pos, float* motor_spd, float* motor_cur,
                           uint8_t* motor_temp, uint8_t* motor_error);
void CanMotorServo_SetOrigin(uint8_t controller_id);
void CanMotorServo_SetPos(uint8_t controller_id, float pos);
void CanMotorServo_SetPosSpeed(uint8_t controller_id, float pos, int16_t spd,
                               int16_t RPA);

#endif
