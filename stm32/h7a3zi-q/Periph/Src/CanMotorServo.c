#include "CanMotorServo.h"
#include "stm32h7xx_hal.h"
#include "stm32h7xx_hal_fdcan.h"


//Prototypes
void HAL_FDCAN_RxFifo0Callback(FDCAN_HandleTypeDef* hfdcan, uint32_t RxFifo0ITs);
void CanMotorServo_Transmit(uint32_t id, const uint8_t* data, uint32_t bytes);
void CanMotorServo_BufferAppendInt16(uint8_t* buffer, int16_t number, int16_t* index);
void CanMotorServo_BufferAppendInt32(uint8_t* buffer, int32_t number, int32_t* index);


void CanMotorServo_Init()
{
	if(HAL_FDCAN_Start(&hfdcan1) != HAL_OK)
	{
	 Error_Handler();
	}

	if(HAL_FDCAN_ActivateNotification(&hfdcan1, FDCAN_IT_RX_FIFO0_NEW_MESSAGE,0) != HAL_OK)
	{
	 Error_Handler();
	}
}



void HAL_FDCAN_RxFifo0Callback(FDCAN_HandleTypeDef *hfdcan, uint32_t RxFifo0ITs)
{
	if((RxFifo0ITs & FDCAN_IT_RX_FIFO0_NEW_MESSAGE) != RESET)
	{
		/* Retreive Rx messages from RX FIFO0 */
		if (HAL_FDCAN_GetRxMessage(hfdcan, FDCAN_RX_FIFO0, &RxHeader, RxData) != HAL_OK)
		{
			/* Reception Error */
			Error_Handler();
		}

		if (HAL_FDCAN_ActivateNotification(hfdcan, FDCAN_IT_RX_FIFO0_NEW_MESSAGE, 0) != HAL_OK)
		{
			/* Notification Error */
			Error_Handler();
		}
	}
}



void CanMotorServo_Transmit(uint32_t id, const uint8_t* data, uint32_t bytes)
{
    uint8_t i = 0;

    TxHeader.Identifier = id;  // ID
    TxHeader.IdType = FDCAN_EXTENDED_ID;
    TxHeader.TxFrameType = FDCAN_DATA_FRAME;
    TxHeader.DataLength = bytes;  // data length
    TxHeader.ErrorStateIndicator = FDCAN_ESI_PASSIVE;
    TxHeader.BitRateSwitch = FDCAN_BRS_OFF;  // Disable BRS for Classic CAN
    TxHeader.FDFormat = FDCAN_CLASSIC_CAN;  // Use Classic CAN format
    TxHeader.TxEventFifoControl = FDCAN_NO_TX_EVENTS;
    TxHeader.MessageMarker = 0;

    // Copy data to TxData

    if( bytes == FDCAN_DLC_BYTES_1){
		for (i = 0; i < 1; i++)
		{
			TxData[i] = data[i];
		}
    }
    else if( bytes == FDCAN_DLC_BYTES_4){
		for (i = 0; i < 4; i++)
		{
			TxData[i] = data[i];
		}
    }
    else if( bytes == FDCAN_DLC_BYTES_8){
		for (i = 0; i < 8; i++)
		{
			TxData[i] = data[i];
		}
    }


    if (HAL_FDCAN_AddMessageToTxFifoQ(&hfdcan1, &TxHeader, TxData) != HAL_OK)
    {
        uint8_t test = 0;
    }
}



void CanMotorServo_Receive(float* motor_pos, float* motor_spd, float* motor_cur,
                   uint8_t* motor_temp, uint8_t* motor_error)
{
    int16_t pos_int = RxData[0] << 8 | RxData[1];
    int16_t spd_int = RxData[2] << 8 | RxData[3];
    int16_t cur_int = RxData[4] << 8 | RxData[5];

    *motor_pos   = (float)(pos_int * 0.1f);  // motor pos
    *motor_spd   = (float)(spd_int * 0.1f);  // motor spd
    *motor_cur   = (float)(cur_int * 0.1f);  // motor cur
    *motor_temp  = RxData[6];  // motor temp
    *motor_error = RxData[7];  // motor error
}


void CanMotorServo_SetOrigin(uint8_t controller_id) {
    // 0: Temporary origin (power failure elimination),
    // For now, only mode 0 works and position can't be saved in drive for power off
    uint8_t set_origin_mode = 0;
    CanMotorServo_Transmit(controller_id | ((uint32_t)CAN_PACKET_SET_ORIGIN_HERE << 8), &set_origin_mode, FDCAN_DLC_BYTES_1);
}


void CanMotorServo_SetPos(uint8_t controller_id, float pos)
{
    int32_t send_index = 0;
    uint8_t buffer[4];
    CanMotorServo_BufferAppendInt32(buffer, (int32_t) (pos * 10000.0), &send_index);
    CanMotorServo_Transmit(controller_id | ((uint32_t) CAN_PACKET_SET_POS << 8), buffer, FDCAN_DLC_BYTES_4);
}

void CanMotorServo_SetSpeed(uint8_t controller_id, float rpm) {
  int32_t send_index = 0;
  uint8_t buffer[4];
  CanMotorServo_BufferAppendInt32(buffer, (int32_t)rpm, &send_index);
  CanMotorServo_Transmit(controller_id | ((uint32_t)CAN_PACKET_SET_RPM << 8), buffer, FDCAN_DLC_BYTES_4);
}

void CanMotorServo_SetPosSpeed(uint8_t controller_id, float pos, int16_t spd, int16_t RPA)
{
	int32_t send_index = 0;
	int16_t send_index1 = 4;

	uint8_t cnt = 0;

	uint8_t buffer[8] = {0};

	CanMotorServo_BufferAppendInt32(buffer, (int32_t)(pos * 10000.0), &send_index);
	CanMotorServo_BufferAppendInt16(buffer,(int16_t)spd, &send_index1);
	CanMotorServo_BufferAppendInt16(buffer,(int16_t) RPA, &send_index1);

	for(int i = 0, j = 7; i < 8/2; i++, j--)
	    {
	        cnt = buffer[i];
	        buffer[i] = buffer[j];
	        buffer[j] = cnt;
	    }

	CanMotorServo_Transmit(controller_id |((uint32_t)CAN_PACKET_SET_POS_SPD << 8), buffer, FDCAN_DLC_BYTES_8);
}

void CanMotorServo_SetRPM(uint8_t controller_id, float rpm) 
{
  int32_t send_index = 0;
  uint8_t buffer[4];
  CanMotorServo_BufferAppendInt32(buffer, (int32_t)rpm, &send_index);
  CanMotorServo_Transmit(controller_id |
  ((uint32_t)CAN_PACKET_SET_RPM << 8), buffer, send_index);
}

void CanMotorServo_SetCurrentBreak(uint8_t controller_id, float current) 
{
  int32_t send_index = 0;
  uint8_t buffer[4];
  CanMotorServo_BufferAppendInt32(buffer, (int32_t)(current * 1000.0), &send_index);
  CanMotorServo_Transmit(controller_id |((uint32_t)CAN_PACKET_SET_CURRENT_BRAKE << 8), buffer, FDCAN_DLC_BYTES_4);
}

void CanMotorServo_SetCurrent(uint8_t controller_id, float current) 
{
  int32_t send_index = 0;
  uint8_t buffer[4];
  CanMotorServo_BufferAppendInt32(buffer, (int32_t)(current * 1000.0), &send_index);
  CanMotorServo_Transmit(controller_id | ((uint32_t)CAN_PACKET_SET_CURRENT << 8), buffer, FDCAN_DLC_BYTES_4);
}

void CanMotorServo_SetDuty(uint8_t controller_id, float duty) 
{
  int32_t send_index = 0;
  uint8_t buffer[4];
  CanMotorServo_BufferAppendInt32(buffer, (int32_t)(duty * 100000.0), &send_index);
  CanMotorServo_Transmit(controller_id |((uint32_t)CAN_PACKET_SET_DUTY << 8), buffer, FDCAN_DLC_BYTES_4);
}


void CanMotorServo_BufferAppendInt16(uint8_t* buffer, int16_t number, int16_t* index)
{
    buffer[(*index)++] = number >> 8;
    buffer[(*index)++] = number;
}

void CanMotorServo_BufferAppendInt32(uint8_t* buffer, int32_t number, int32_t* index)
{
    buffer[(*index)++] = number >> 24;
    buffer[(*index)++] = number >> 16;
    buffer[(*index)++] = number >> 8;
    buffer[(*index)++] = number;
}







