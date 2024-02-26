#include "Periph_Canbus.h"

void PeriphCanbus_Init()
{
	  // Set filter ID and mask
	  fdcanFilterConfig.IdType = FDCAN_EXTENDED_ID;
	  fdcanFilterConfig.FilterIndex = 0;
	  fdcanFilterConfig.FilterType = FDCAN_FILTER_MASK;
	  fdcanFilterConfig.FilterConfig = FDCAN_FILTER_TO_RXFIFO0;
	  fdcanFilterConfig.FilterID1 = 0x0000;
	  fdcanFilterConfig.FilterID2 = 0x0000;
	  fdcanFilterConfig.RxBufferIndex = 0;
	  if (HAL_FDCAN_ConfigFilter(&hfdcan1, &fdcanFilterConfig) != HAL_OK)
	  {
		// Filter configuration error
		Error_Handler();
	  }

	if (HAL_FDCAN_Start(&hfdcan1) != HAL_OK)
	{
	  Error_Handler();
	}

	if (HAL_FDCAN_ActivateNotification(&hfdcan1, FDCAN_IT_RX_FIFO0_NEW_MESSAGE,
									 0) != HAL_OK)
	{
	  Error_Handler();
	}
}


void HAL_FDCAN_RxFifo0Callback(FDCAN_HandleTypeDef* hfdcan, uint32_t RxFifo0ITs)
{
    if ((RxFifo0ITs & FDCAN_IT_RX_FIFO0_NEW_MESSAGE) != RESET)
    {
        /* Retreive Rx messages from RX FIFO0 */
        if (HAL_FDCAN_GetRxMessage(hfdcan, FDCAN_RX_FIFO0, &RxHeader, RxData) !=
            HAL_OK)
        {
            /* Reception Error */
            Error_Handler();
        }

        if (HAL_FDCAN_ActivateNotification(
                hfdcan, FDCAN_IT_RX_FIFO0_NEW_MESSAGE, 0) != HAL_OK)
        {
            /* Notification Error */
            Error_Handler();
        }
    }
}

void PeriphCanbus_TransmitDLC8(uint32_t id, uint8_t* data)
{
    TxHeader.Identifier          = id;  // ID
    TxHeader.IdType              = FDCAN_STANDARD_ID;
    TxHeader.TxFrameType         = FDCAN_DATA_FRAME;
    TxHeader.DataLength          = FDCAN_DLC_BYTES_8;  // data length
    TxHeader.ErrorStateIndicator = FDCAN_ESI_ACTIVE;
    TxHeader.BitRateSwitch      = FDCAN_BRS_OFF;  // Disable BRS for Classic CAN
    TxHeader.FDFormat           = FDCAN_CLASSIC_CAN;  // Use Classic CAN format
    TxHeader.TxEventFifoControl = FDCAN_NO_TX_EVENTS;
    TxHeader.MessageMarker      = 0;

    // Copy data to TxData
	for (uint8_t i = 0; i < 8; i++)
	{
		TxData[i] = data[i];
	}

    if (HAL_FDCAN_AddMessageToTxFifoQ(&hfdcan1, &TxHeader, TxData) != HAL_OK)
    {
        uint8_t test = 0;
    }
}

uint8_t PeriphCanbus_ExtractControllerID(uint32_t ext_id)
{
    return (uint8_t) (ext_id & 0xFF);
}
