/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2023 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "cmsis_os.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#include "cJSON.h"
#include "uartRingBufDMA.h"
#include "comUtils_UART2.h"

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

#define MAX_JSON_LENGTH 20

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

FDCAN_HandleTypeDef hfdcan1;
FDCAN_FilterTypeDef fdcanFilterConfig;

UART_HandleTypeDef huart2;
UART_HandleTypeDef huart3;
DMA_HandleTypeDef hdma_usart2_rx;

osThreadId SendJSONHandle;
osThreadId ReceiveHMIHandle;
osThreadId SerialDetectHandle;
/* USER CODE BEGIN PV */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_DMA_Init(void);
static void MX_USB_OTG_HS_USB_Init(void);
static void MX_FDCAN1_Init(void);
static void MX_USART2_UART_Init(void);
static void MX_USART3_UART_Init(void);
void SendJSONTask(void const * argument);
void ReceiveHMITask(void const * argument);
void SerialDetectTask(void const * argument);

/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

#define MainBuf_UART2_SIZE 1024

extern uint8_t MainBuf_UART2[MainBuf_UART2_SIZE];

extern char id[20];

// CAN message

typedef enum {
	CAN_PACKET_SET_DUTY = 0, // Duty cycle mode
	CAN_PACKET_SET_CURRENT, // Current loop mode
	CAN_PACKET_SET_CURRENT_BRAKE, // Current brake mode
	CAN_PACKET_SET_RPM, // Velocity mode
	CAN_PACKET_SET_POS, // Position mode
	CAN_PACKET_SET_ORIGIN_HERE, // Set origin mode
	CAN_PACKET_POS_SPD, // Position velocity loop mode
}CAN_PACKET_ID;


FDCAN_TxHeaderTypeDef TxHeader;
FDCAN_RxHeaderTypeDef RxHeader;


uint8_t TxData[8];
uint8_t RxData[8];

uint32_t TxMailbox;

// Motor values
float p_in;


void HAL_CAN_RxFifo0MsgPendingCallback(FDCAN_HandleTypeDef *hcan){

	HAL_FDCAN_GetRxMessage(hcan, FDCAN_RX_FIFO0, &RxHeader, RxData);

}

// SERVO MODE

void buffer_append_int16(uint8_t* buffer,int16_t number, int16_t* index){
	buffer[(*index)++] = number >> 8;
	buffer[(*index)++] = number;
}

void buffer_append_int32(uint8_t* buffer,int32_t number, int32_t* index){
	buffer[(*index)++] = number >> 24;
	buffer[(*index)++] = number >> 16;
	buffer[(*index)++] = number >> 8;
	buffer[(*index)++] = number;
}

void comm_can_transmit_eid(uint32_t id, const uint8_t* data, uint8_t len){

		uint8_t i=0;

		if(len>8){
			len=8;
		}

		TxHeader.Identifier = id; // ID
		TxHeader.IdType = FDCAN_EXTENDED_ID; // Extended ID
		TxHeader.TxFrameType = FDCAN_DATA_FRAME; // Data frame
		TxHeader.DataLength = len; // Data length
		TxHeader.ErrorStateIndicator = FDCAN_ESI_ACTIVE; // Error state indicator

		for(i=0;i<len;i++){
		  TxData[i] = data[i];
		}

		if (HAL_FDCAN_AddMessageToTxFifoQ(&hfdcan1, &TxHeader, TxData) != HAL_OK) {
			Error_Handler();
		}

}

void motor_receive(float* motor_pos, float* motor_spd, float* motor_cur, uint8_t* motor_temp, uint8_t* motor_error) {

	int16_t pos_int = RxData[0] << 8 | RxData[1];
	int16_t spd_int = RxData[2] << 8 | RxData[3];
	int16_t cur_int = RxData[4] << 8 | RxData[5];

    *motor_pos = (float)(pos_int * 0.1f); // motor pos
    *motor_spd = (float)(spd_int * 0.1f); // motor spd
    *motor_cur = (float)(cur_int * 0.1f); // motor cur
    *motor_temp = RxData[6];   // motor temp
    *motor_error = RxData[7];  // motor error
}

//void comm_can_set_origin(uint8_t controller_id) {
//    CAN_TxHeaderTypeDef TxHeader;
//    uint8_t TxData[8] = {0};  // Initialize to zeros
//
//    TxHeader.DLC = 0;  // No data payload
//    TxHeader.IDE = CAN_ID_EXT;
//    TxHeader.RTR = CAN_RTR_DATA;
//    TxHeader.StdId = 0;  // Standard ID (not used in extended mode)
//    TxHeader.ExtId = controller_id | ((uint32_t)CAN_PACKET_SET_ORIGIN_HERE << 8);
//
//    if (HAL_CAN_AddTxMessage(&hfdcan1, &TxHeader, TxData, &TxMailbox) != HAL_OK) {
//        Error_Handler();
//    }
//}



void comm_can_set_pos(uint8_t controller_id, float pos) {
	int32_t send_index = 0;
	uint8_t buffer[4];
	buffer_append_int32(buffer, (int32_t)(pos * 1000000.0), &send_index);
	comm_can_transmit_eid(controller_id |
			((uint32_t)CAN_PACKET_SET_POS << 8), buffer, send_index);
}

void comm_can_set_pos_spd(uint8_t controller_id, float pos, int16_t spd, int16_t RPA){
	int32_t send_index = 0;
	int16_t send_index1 = 0;
	uint8_t buffer[4];
	buffer_append_int32(buffer, (int32_t)(pos*1000000.0), &send_index);
	buffer_append_int16(buffer,spd, &send_index1);
	buffer_append_int16(buffer,RPA, &send_index1);
	comm_can_transmit_eid(controller_id | ((uint32_t)CAN_PACKET_POS_SPD<<8),buffer,send_index);
}

// MIT MODE

//int float_to_uint(float x, float x_min, float x_max, unsigned int bits)
//{
//    // Calculate the span of the range
//    float span = x_max - x_min;
//
//    // Ensure that x is within the specified range
//    if (x < x_min)
//        x = x_min;
//    else if (x > x_max)
//        x = x_max;
//
//    // Map the float value x to an unsigned integer within the specified range and precision
//    return (int)((x - x_min) * ((float)(1 << bits) / span));
//    // Exemple:
//    // mapped_value = (int)((7.5 - 0.0) * ((float)(1 << 12) / 10.0))
//    // mapped_value = (int)(7.5 * (4096.0 / 10.0))
//    // mapped_value = (int)(7.5 * 409.6)
//    // mapped_value = (int)(3072.0)
//    // mapped_value = 3072
//}

//void comm_can_transmit_eid(uint32_t id, uint8_t* data, uint8_t len) {
////    uint8_t i = 0;
//
//    if (len > 8) {
//        len = 8;
//    }
//
//    TxHeader.DLC = len;  // data length
//    TxHeader.IDE = CAN_ID_STD;
//    TxHeader.RTR = CAN_RTR_DATA;
//    TxHeader.StdId = 0x1;
//    TxHeader.ExtId = 0;  // Use the provided id parameter as the Extended ID
//
//    if (HAL_CAN_AddTxMessage(&hfdcan1, &TxHeader, data, &TxMailbox) != HAL_OK) {
//        Error_Handler();
//    }
//}

//void EnterMotorMode(uint8_t controller_id) {
//    uint8_t data[8];
//
//    data[0] = 0xFF;
//    data[1] = 0xFF;
//    data[2] = 0xFF;
//    data[3] = 0xFF;
//    data[4] = 0xFF;
//    data[5] = 0xFF;
//    data[6] = 0xFF;
//    data[7] = 0xFC;
//
//    // Pass the controller_id as the Extended ID to comm_can_transmit_eid
//    comm_can_transmit_eid(controller_id, data, 8);
//}
//
//
//void ExitMotorMode(uint8_t controller_id){
//
//    uint8_t data[8];
//
//	data[0] = 0xFF;
//	data[1] = 0xFF;
//	data[2] = 0xFF;
//	data[3] = 0xFF;
//	data[4] = 0xFF;
//	data[5] = 0xFF;
//	data[6] = 0xFF;
//	data[7] = 0xFD;
//	comm_can_transmit_eid(controller_id, data, 8);
//
//
//}
//
//void Zero(uint8_t controller_id){
//	uint8_t data[8];
//
//	data[0] = 0xFF;
//	data[1] = 0xFF;
//	data[2] = 0xFF;
//	data[3] = 0xFF;
//	data[4] = 0xFF;
//	data[5] = 0xFF;
//	data[6] = 0xFF;
//	data[7] = 0xFE;
//	comm_can_transmit_eid(controller_id, data, 8);
//
//
//}
//
//
//void pack_MIT_cmd(uint8_t controller_id, float p_des, float v_des, float kp, float kd, float t_ff){ /// limit data to be within bounds ///
//	float P_MIN =-12.5f;
//	float P_MAX =12.5f;
//	float V_MIN =-50.0f;
//	float V_MAX =50.0f;
//	float T_MIN =-65.0f;
//	float T_MAX =65.0f;
//	float Kp_MIN =0;
//	float Kp_MAX =500;
//	float Kd_MIN =0;
//	float Kd_MAX =5;
//    uint8_t data[8];
//
//	p_des = fminf(fmaxf(P_MIN, p_des), P_MAX);
//	v_des = fminf(fmaxf(V_MIN, v_des), V_MAX);
//	kp = fminf(fmaxf(Kp_MIN, kp), Kp_MAX);
//	kd = fminf(fmaxf(Kd_MIN, kd), Kd_MAX);
//	t_ff = fminf(fmaxf(T_MIN, t_ff), T_MAX);
//
//	/// convert floats to unsigned ints ///
//	unsigned int p_int = float_to_uint(p_des, P_MIN, P_MAX, 16);
//	unsigned int v_int = float_to_uint(v_des, V_MIN, V_MAX, 12);
//	unsigned int kp_int = float_to_uint(kp, Kp_MIN, Kp_MAX, 12);
//	unsigned int kd_int = float_to_uint(kd, Kd_MIN, Kd_MAX, 12);
//	unsigned int t_int = float_to_uint(t_ff, T_MIN, T_MAX, 12);
//
//	/// pack ints into the can buffer ///
//	data[0] = p_int >> 8; // post 8 bit high
//	data[1] = p_int & 0xFF;// post 8 bit low
//	data[2] = v_int >> 4;
//	data[3] = ((v_int & 0xF) << 4) | (kp_int >> 8); // Speed 4 bit lower KP 4bit higher
//	data[4] = kp_int & 0xFF; // KP 8 bit lower
//	data[5] = kd_int >> 4; // Kd 8 bit higher
//	data[6] = ((kd_int & 0xF) << 4) | (kp_int >> 8); // KP 4 bit lower torque 4 bit higher
//	data[7] = t_int & 0xFF; // torque 4 bit lower
//
//	comm_can_transmit_eid(controller_id, data, 8);
//
//}

//void unpack_reply(){
//
//	uint8_t len = 0;
//	uint8_t data[8];
//
//	HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &RxHeader, RxData);
//
//
//
//}


/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */
  cJSON_InitHooks(NULL);

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_USB_OTG_HS_USB_Init();
  MX_FDCAN1_Init();
  MX_USART2_UART_Init();
  MX_USART3_UART_Init();
  /* USER CODE BEGIN 2 */

  Ringbuf_Init();

  HAL_FDCAN_Start(&hfdcan1);

  // Activate the notification
  HAL_FDCAN_ActivateNotification(&hfdcan1, FDCAN_IT_RX_FIFO0_NEW_MESSAGE, 0);



//  HAL_UART_Transmit(&huart1, (uint8_t *)"AT+RST\r\n", 8, 1000);
//  while (ESP_Init("dlink08", "78542e0651a0") != 1)
//  {
//
//  }

  /* USER CODE END 2 */

  /* USER CODE BEGIN RTOS_MUTEX */
  /* add mutexes, ... */
  /* USER CODE END RTOS_MUTEX */

  /* USER CODE BEGIN RTOS_SEMAPHORES */
  /* add semaphores, ... */
  /* USER CODE END RTOS_SEMAPHORES */

  /* USER CODE BEGIN RTOS_TIMERS */
  /* start timers, add new ones, ... */
  /* USER CODE END RTOS_TIMERS */

  /* USER CODE BEGIN RTOS_QUEUES */
  /* add queues, ... */
  /* USER CODE END RTOS_QUEUES */

  /* Create the thread(s) */
  /* definition and creation of SendJSON */
  osThreadDef(SendJSON, SendJSONTask, osPriorityLow, 0, 256);
  SendJSONHandle = osThreadCreate(osThread(SendJSON), NULL);

  /* definition and creation of ReceiveHMI */
  osThreadDef(ReceiveHMI, ReceiveHMITask, osPriorityLow, 0, 128);
  ReceiveHMIHandle = osThreadCreate(osThread(ReceiveHMI), NULL);

  /* definition and creation of SerialDetect */
  osThreadDef(SerialDetect, SerialDetectTask, osPriorityRealtime, 0, 128);
  SerialDetectHandle = osThreadCreate(osThread(SerialDetect), NULL);

  /* USER CODE BEGIN RTOS_THREADS */
  /* add threads, ... */
  /* USER CODE END RTOS_THREADS */

  /* Start scheduler */
  osKernelStart();

  /* We should never get here as control is now taken by the scheduler */
  /* Infinite loop */
  /* USER CODE BEGIN WHILE */

//  uint8_t result = add(2,3);

  while (1)
  {

    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /*AXI clock gating */
  RCC->CKGAENR = 0xFFFFFFFF;

  /** Supply configuration update enable
  */
  HAL_PWREx_ConfigSupply(PWR_DIRECT_SMPS_SUPPLY);

  /** Configure the main internal regulator output voltage
  */
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE0);

  while(!__HAL_PWR_GET_FLAG(PWR_FLAG_VOSRDY)) {}

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI48|RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_ON;
  RCC_OscInitStruct.HSI48State = RCC_HSI48_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLM = 1;
  RCC_OscInitStruct.PLL.PLLN = 24;
  RCC_OscInitStruct.PLL.PLLP = 2;
  RCC_OscInitStruct.PLL.PLLQ = 4;
  RCC_OscInitStruct.PLL.PLLR = 2;
  RCC_OscInitStruct.PLL.PLLRGE = RCC_PLL1VCIRANGE_3;
  RCC_OscInitStruct.PLL.PLLVCOSEL = RCC_PLL1VCOWIDE;
  RCC_OscInitStruct.PLL.PLLFRACN = 0;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2
                              |RCC_CLOCKTYPE_D3PCLK1|RCC_CLOCKTYPE_D1PCLK1;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.SYSCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_HCLK_DIV1;
  RCC_ClkInitStruct.APB3CLKDivider = RCC_APB3_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_APB1_DIV1;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_APB2_DIV1;
  RCC_ClkInitStruct.APB4CLKDivider = RCC_APB4_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief FDCAN1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_FDCAN1_Init(void)
{

  /* USER CODE BEGIN FDCAN1_Init 0 */

  /* USER CODE END FDCAN1_Init 0 */

  /* USER CODE BEGIN FDCAN1_Init 1 */

  /* USER CODE END FDCAN1_Init 1 */
  hfdcan1.Instance = FDCAN1;
  hfdcan1.Init.FrameFormat = FDCAN_FRAME_CLASSIC;
  hfdcan1.Init.Mode = FDCAN_MODE_NORMAL;
  hfdcan1.Init.AutoRetransmission = DISABLE;
  hfdcan1.Init.TransmitPause = DISABLE;
  hfdcan1.Init.ProtocolException = DISABLE;
  hfdcan1.Init.NominalPrescaler = 16;
  hfdcan1.Init.NominalSyncJumpWidth = 1;
  hfdcan1.Init.NominalTimeSeg1 = 2;
  hfdcan1.Init.NominalTimeSeg2 = 2;
  hfdcan1.Init.DataPrescaler = 1;
  hfdcan1.Init.DataSyncJumpWidth = 1;
  hfdcan1.Init.DataTimeSeg1 = 1;
  hfdcan1.Init.DataTimeSeg2 = 1;
  hfdcan1.Init.MessageRAMOffset = 0;
  hfdcan1.Init.StdFiltersNbr = 0;
  hfdcan1.Init.ExtFiltersNbr = 0;
  hfdcan1.Init.RxFifo0ElmtsNbr = 0;
  hfdcan1.Init.RxFifo0ElmtSize = FDCAN_DATA_BYTES_8;
  hfdcan1.Init.RxFifo1ElmtsNbr = 0;
  hfdcan1.Init.RxFifo1ElmtSize = FDCAN_DATA_BYTES_8;
  hfdcan1.Init.RxBuffersNbr = 0;
  hfdcan1.Init.RxBufferSize = FDCAN_DATA_BYTES_8;
  hfdcan1.Init.TxEventsNbr = 0;
  hfdcan1.Init.TxBuffersNbr = 0;
  hfdcan1.Init.TxFifoQueueElmtsNbr = 0;
  hfdcan1.Init.TxFifoQueueMode = FDCAN_TX_FIFO_OPERATION;
  hfdcan1.Init.TxElmtSize = FDCAN_DATA_BYTES_8;
  if (HAL_FDCAN_Init(&hfdcan1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN FDCAN1_Init 2 */

  fdcanFilterConfig.IdType = FDCAN_STANDARD_ID; // or FDCAN_EXTENDED_ID, depending on your needs
  fdcanFilterConfig.FilterIndex = 10; // which filter bank to use from the assigned ones
  fdcanFilterConfig.FilterType = FDCAN_FILTER_DUAL; // or FDCAN_FILTER_MASK or other types
  fdcanFilterConfig.FilterConfig = FDCAN_FILTER_TO_RXFIFO0; // or other configurations
  fdcanFilterConfig.FilterID1 = 0;
  fdcanFilterConfig.FilterID2 = 0;
  fdcanFilterConfig.RxBufferIndex = 0; // Relevant if FilterConfig is set to FDCAN_FILTER_TO_RXBUFFER
  fdcanFilterConfig.IsCalibrationMsg = 0; // Relevant if FilterConfig is set to FDCAN_FILTER_TO_RXBUFFER


  /* USER CODE END FDCAN1_Init 2 */

}

/**
  * @brief USART2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART2_UART_Init(void)
{

  /* USER CODE BEGIN USART2_Init 0 */

  /* USER CODE END USART2_Init 0 */

  /* USER CODE BEGIN USART2_Init 1 */

  /* USER CODE END USART2_Init 1 */
  huart2.Instance = USART2;
  huart2.Init.BaudRate = 115200;
  huart2.Init.WordLength = UART_WORDLENGTH_8B;
  huart2.Init.StopBits = UART_STOPBITS_1;
  huart2.Init.Parity = UART_PARITY_NONE;
  huart2.Init.Mode = UART_MODE_TX_RX;
  huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart2.Init.OverSampling = UART_OVERSAMPLING_16;
  huart2.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart2.Init.ClockPrescaler = UART_PRESCALER_DIV1;
  huart2.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart2) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_UARTEx_SetTxFifoThreshold(&huart2, UART_TXFIFO_THRESHOLD_1_8) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_UARTEx_SetRxFifoThreshold(&huart2, UART_RXFIFO_THRESHOLD_1_8) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_UARTEx_DisableFifoMode(&huart2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART2_Init 2 */

  /* USER CODE END USART2_Init 2 */

}

/**
  * @brief USART3 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART3_UART_Init(void)
{

  /* USER CODE BEGIN USART3_Init 0 */

  /* USER CODE END USART3_Init 0 */

  /* USER CODE BEGIN USART3_Init 1 */

  /* USER CODE END USART3_Init 1 */
  huart3.Instance = USART3;
  huart3.Init.BaudRate = 115200;
  huart3.Init.WordLength = UART_WORDLENGTH_8B;
  huart3.Init.StopBits = UART_STOPBITS_1;
  huart3.Init.Parity = UART_PARITY_NONE;
  huart3.Init.Mode = UART_MODE_TX_RX;
  huart3.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart3.Init.OverSampling = UART_OVERSAMPLING_16;
  huart3.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart3.Init.ClockPrescaler = UART_PRESCALER_DIV1;
  huart3.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart3) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_UARTEx_SetTxFifoThreshold(&huart3, UART_TXFIFO_THRESHOLD_1_8) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_UARTEx_SetRxFifoThreshold(&huart3, UART_RXFIFO_THRESHOLD_1_8) != HAL_OK)
  {
    Error_Handler();
  }
  if (HAL_UARTEx_DisableFifoMode(&huart3) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART3_Init 2 */

  /* USER CODE END USART3_Init 2 */

}

/**
  * @brief USB_OTG_HS Initialization Function
  * @param None
  * @retval None
  */
static void MX_USB_OTG_HS_USB_Init(void)
{

  /* USER CODE BEGIN USB_OTG_HS_Init 0 */

  /* USER CODE END USB_OTG_HS_Init 0 */

  /* USER CODE BEGIN USB_OTG_HS_Init 1 */

  /* USER CODE END USB_OTG_HS_Init 1 */
  /* USER CODE BEGIN USB_OTG_HS_Init 2 */

  /* USER CODE END USB_OTG_HS_Init 2 */

}

/**
  * Enable DMA controller clock
  */
static void MX_DMA_Init(void)
{

  /* DMA controller clock enable */
  __HAL_RCC_DMA1_CLK_ENABLE();

  /* DMA interrupt init */
  /* DMA1_Stream0_IRQn interrupt configuration */
  HAL_NVIC_SetPriority(DMA1_Stream0_IRQn, 5, 0);
  HAL_NVIC_EnableIRQ(DMA1_Stream0_IRQn);

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
/* USER CODE BEGIN MX_GPIO_Init_1 */
/* USER CODE END MX_GPIO_Init_1 */

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOF_CLK_ENABLE();
  __HAL_RCC_GPIOH_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();
  __HAL_RCC_GPIOD_CLK_ENABLE();
  __HAL_RCC_GPIOG_CLK_ENABLE();
  __HAL_RCC_GPIOE_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(USB_FS_PWR_EN_GPIO_Port, USB_FS_PWR_EN_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOB, LD1_Pin|LD3_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin : B1_Pin */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pin : USB_FS_PWR_EN_Pin */
  GPIO_InitStruct.Pin = USB_FS_PWR_EN_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(USB_FS_PWR_EN_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pins : LD1_Pin LD3_Pin */
  GPIO_InitStruct.Pin = LD1_Pin|LD3_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);

  /*Configure GPIO pin : USB_FS_OVCR_Pin */
  GPIO_InitStruct.Pin = USB_FS_OVCR_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_IT_RISING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(USB_FS_OVCR_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pin : USB_FS_VBUS_Pin */
  GPIO_InitStruct.Pin = USB_FS_VBUS_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(USB_FS_VBUS_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pin : USB_FS_ID_Pin */
  GPIO_InitStruct.Pin = USB_FS_ID_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  GPIO_InitStruct.Alternate = GPIO_AF10_OTG1_HS;
  HAL_GPIO_Init(USB_FS_ID_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pins : USB_FS_N_Pin USB_FS_P_Pin */
  GPIO_InitStruct.Pin = USB_FS_N_Pin|USB_FS_P_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

  /*Configure GPIO pin : LD2_Pin */
  GPIO_InitStruct.Pin = LD2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(LD2_GPIO_Port, &GPIO_InitStruct);

/* USER CODE BEGIN MX_GPIO_Init_2 */
/* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/* USER CODE BEGIN Header_SendJSONTask */
/**
  * @brief  Function implementing the SendJSON thread.
  * @param  argument: Not used
  * @retval None
  */

/* USER CODE END Header_SendJSONTask */
void SendJSONTask(void const * argument)
{
  /* USER CODE BEGIN 5 */
  /* Infinite loop */

  for (;;)
  {

		// Call motor_receive function
		float motor_pos, motor_spd, motor_cur;
		uint8_t motor_temp, motor_error;

		motor_receive(&motor_pos, &motor_spd, &motor_cur, &motor_temp, &motor_error);


	    cJSON *root = cJSON_CreateObject();

	    // Convert numbers to strings using sprintf
	    char dorsiflexionStr[20];
	    char eversionStr[20];
	    char extensionStr[20];

	    sprintf(dorsiflexionStr, "%.2f", motor_pos);
	    sprintf(eversionStr, "%d", 42);
	    sprintf(extensionStr, "%d", 42);

	    // Add strings to the JSON object
	    cJSON_AddStringToObject(root, "dorsiflexion", dorsiflexionStr);
	    cJSON_AddStringToObject(root, "eversion", eversionStr);
	    cJSON_AddStringToObject(root, "extension", extensionStr);

	    // Print the JSON object
	    char *jsonMessage = cJSON_PrintUnformatted(root);
	    printf("%s\n", jsonMessage);


		// Send JSON string over UART
		HAL_UART_Transmit(&huart2, (uint8_t *)jsonMessage, strlen(jsonMessage), HAL_MAX_DELAY);

	    cJSON_Delete(root);
	    free(jsonMessage);

    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
  vTaskDelete(NULL);
  /* USER CODE END 5 */
}

/* USER CODE BEGIN Header_ReceiveHMITask */
/**
* @brief Function implementing the ReceiveHMI thread.
* @param argument: Not used
* @retval None
*/
/* USER CODE END Header_ReceiveHMITask */
void ReceiveHMITask(void const * argument)
{
  /* USER CODE BEGIN ReceiveHMITask */
  /* Infinite loop */
  for(;;)
  {
	  float p_step = 0.1;

	  char* foundWord = searchWord((char*) MainBuf_UART2);

	  if (strcmp(foundWord, "eversionR") == 0) {
//	      comm_can_set_pos_spd(1, 360, -32000, 200); // pos: -360-360, spd: -32768-32767, RPA: 0-200

//		  comm_can_set_origin(1);

//		  p_in = p_in - p_step;
//		  comm_can_set_pos(1, p_in);
	  }
	  else if (strcmp(foundWord, "eversionL") == 0) {
		  p_in = p_in + p_step;
		  comm_can_set_pos(1, p_in);
	  }

    /*
    Switch case here when a word is found in MainBuf
    */

	  vTaskDelay(100 / portTICK_PERIOD_MS);

  }
  vTaskDelete(NULL);
  /* USER CODE END ReceiveHMITask */
}

/* USER CODE BEGIN Header_SerialDetectTask */
/**
* @brief Function implementing the SerialDetect thread.
* @param argument: Not used
* @retval None
*/
/* USER CODE END Header_SerialDetectTask */
void SerialDetectTask(void const * argument)
{
  /* USER CODE BEGIN SerialDetectTask */
  uint8_t uart2_detected = 0;

  for(;;)
  {
    // Check UART2 connection status
    if (HAL_UART_GetState(&huart2) == HAL_UART_STATE_READY) {
      uart2_detected = 1; // UART2 is detected
    } else {
      uart2_detected = 0; // UART2 is not detected
    }

    // Do something based on the UART2 detection status
    if (uart2_detected) {
      // Delay before checking again
      osDelay(pdMS_TO_TICKS(1000)); // Adjust the delay period as needed
    } else {
      // UART2 not detected, stay in this task
      osDelay(portMAX_DELAY); // Block the task indefinitely
    }
  }
  /* USER CODE END SerialDetectTask */
}

/**
  * @brief  Period elapsed callback in non blocking mode
  * @note   This function is called  when TIM6 interrupt took place, inside
  * HAL_TIM_IRQHandler(). It makes a direct call to HAL_IncTick() to increment
  * a global variable "uwTick" used as application time base.
  * @param  htim : TIM handle
  * @retval None
  */
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
  /* USER CODE BEGIN Callback 0 */

  /* USER CODE END Callback 0 */
  if (htim->Instance == TIM6) {
    HAL_IncTick();
  }
  /* USER CODE BEGIN Callback 1 */

  /* USER CODE END Callback 1 */
}

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}

#ifdef  USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
