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
#include "fatfs.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#include "cJSON.h"
#include "uartRingBufDMA.h"
#include "comUtils_UART2.h"
#include "CAN_Motor_Servo.h"
#include "File_Handling_RTOS.h"

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

SPI_HandleTypeDef hspi1;

UART_HandleTypeDef huart3;
DMA_HandleTypeDef hdma_usart3_rx;

osThreadId SendJSONHandle;
osThreadId ReceiveHMIHandle;
osThreadId SDCardHandle;
/* USER CODE BEGIN PV */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_DMA_Init(void);
static void MX_USB_OTG_HS_USB_Init(void);
static void MX_FDCAN1_Init(void);
static void MX_SPI1_Init(void);
static void MX_USART3_UART_Init(void);
void SendJSONTask(void const * argument);
void ReceiveHMITask(void const * argument);
void SDCard_Task(void const * argument);

/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

// COM Variables
#define MainBuf_UART_SIZE 1024

extern uint8_t MainBuf_UART[MainBuf_UART_SIZE];

extern char id[20];

FDCAN_TxHeaderTypeDef TxHeader;
FDCAN_RxHeaderTypeDef RxHeader;
FDCAN_FilterTypeDef fdcanFilterConfig;


uint8_t TxData[8];
uint8_t RxData[8];

uint32_t TxMailbox;

// Motor values
float p_in_1 = 0.0f;
float p_in_2 = 0.0f;
float p_in_3 = 0.0f;

void parseFileContent(char *fileContent, float *p_in_1, float *p_in_2, float *p_in_3) {
    // Assuming the content format is "1. %f 2. %f 3. %f"
    sscanf(fileContent, "1. %f 2. %f 3. %f", p_in_1, p_in_2, p_in_3);
    vPortFree(fileContent);
}

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
  MX_SPI1_Init();
  MX_FATFS_Init();
  MX_USART3_UART_Init();
  /* USER CODE BEGIN 2 */

  Ringbuf_Init();

  if(HAL_FDCAN_Start(&hfdcan1) != HAL_OK)
  {
	 Error_Handler();
  }

  if(HAL_FDCAN_ActivateNotification(&hfdcan1, FDCAN_IT_RX_FIFO0_NEW_MESSAGE,0) != HAL_OK)
  {
	 Error_Handler();
  }

//  Mount_SD("/");
//  char* homeBuff = Read_File("home.txt");
//  parseFileContent(homeBuff, &p_in_1, &p_in_2, &p_in_3);
//  Format_SD();
//  Create_File("home.txt");
//  Unmount_SD("/");

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
  osThreadDef(SendJSON, SendJSONTask, osPriorityNormal, 0, 220);
  SendJSONHandle = osThreadCreate(osThread(SendJSON), NULL);

  /* definition and creation of ReceiveHMI */
  osThreadDef(ReceiveHMI, ReceiveHMITask, osPriorityRealtime, 0, 128);
  ReceiveHMIHandle = osThreadCreate(osThread(ReceiveHMI), NULL);

  /* definition and creation of SDCard */
  osThreadDef(SDCard, SDCard_Task, osPriorityHigh, 0, 220);
  SDCardHandle = osThreadCreate(osThread(SDCard), NULL);

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
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI48|RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_DIV1;
  RCC_OscInitStruct.HSICalibrationValue = 64;
  RCC_OscInitStruct.HSI48State = RCC_HSI48_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
  RCC_OscInitStruct.PLL.PLLM = 4;
  RCC_OscInitStruct.PLL.PLLN = 8;
  RCC_OscInitStruct.PLL.PLLP = 2;
  RCC_OscInitStruct.PLL.PLLQ = 1;
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
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_HSI;
  RCC_ClkInitStruct.SYSCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_HCLK_DIV1;
  RCC_ClkInitStruct.APB3CLKDivider = RCC_APB3_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_APB1_DIV1;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_APB2_DIV1;
  RCC_ClkInitStruct.APB4CLKDivider = RCC_APB4_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_1) != HAL_OK)
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
  hfdcan1.Init.AutoRetransmission = ENABLE;
  hfdcan1.Init.TransmitPause = DISABLE;
  hfdcan1.Init.ProtocolException = DISABLE;
  hfdcan1.Init.NominalPrescaler = 16;
  hfdcan1.Init.NominalSyncJumpWidth = 13;
  hfdcan1.Init.NominalTimeSeg1 = 5;
  hfdcan1.Init.NominalTimeSeg2 = 10;
  hfdcan1.Init.DataPrescaler = 5;
  hfdcan1.Init.DataSyncJumpWidth = 6;
  hfdcan1.Init.DataTimeSeg1 = 13;
  hfdcan1.Init.DataTimeSeg2 = 6;
  hfdcan1.Init.MessageRAMOffset = 0;
  hfdcan1.Init.StdFiltersNbr = 0;
  hfdcan1.Init.ExtFiltersNbr = 1;
  hfdcan1.Init.RxFifo0ElmtsNbr = 1;
  hfdcan1.Init.RxFifo0ElmtSize = FDCAN_DATA_BYTES_8;
  hfdcan1.Init.RxFifo1ElmtsNbr = 0;
  hfdcan1.Init.RxFifo1ElmtSize = FDCAN_DATA_BYTES_8;
  hfdcan1.Init.RxBuffersNbr = 0;
  hfdcan1.Init.RxBufferSize = FDCAN_DATA_BYTES_8;
  hfdcan1.Init.TxEventsNbr = 0;
  hfdcan1.Init.TxBuffersNbr = 0;
  hfdcan1.Init.TxFifoQueueElmtsNbr = 1;
  hfdcan1.Init.TxFifoQueueMode = FDCAN_TX_FIFO_OPERATION;
  hfdcan1.Init.TxElmtSize = FDCAN_DATA_BYTES_8;
  if (HAL_FDCAN_Init(&hfdcan1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN FDCAN1_Init 2 */

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

  /* USER CODE END FDCAN1_Init 2 */

}

/**
  * @brief SPI1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_SPI1_Init(void)
{

  /* USER CODE BEGIN SPI1_Init 0 */

  /* USER CODE END SPI1_Init 0 */

  /* USER CODE BEGIN SPI1_Init 1 */

  /* USER CODE END SPI1_Init 1 */
  /* SPI1 parameter configuration*/
  hspi1.Instance = SPI1;
  hspi1.Init.Mode = SPI_MODE_MASTER;
  hspi1.Init.Direction = SPI_DIRECTION_2LINES;
  hspi1.Init.DataSize = SPI_DATASIZE_8BIT;
  hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
  hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
  hspi1.Init.NSS = SPI_NSS_SOFT;
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_2;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 0x0;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
  hspi1.Init.NSSPolarity = SPI_NSS_POLARITY_LOW;
  hspi1.Init.FifoThreshold = SPI_FIFO_THRESHOLD_01DATA;
  hspi1.Init.TxCRCInitializationPattern = SPI_CRC_INITIALIZATION_ALL_ZERO_PATTERN;
  hspi1.Init.RxCRCInitializationPattern = SPI_CRC_INITIALIZATION_ALL_ZERO_PATTERN;
  hspi1.Init.MasterSSIdleness = SPI_MASTER_SS_IDLENESS_00CYCLE;
  hspi1.Init.MasterInterDataIdleness = SPI_MASTER_INTERDATA_IDLENESS_00CYCLE;
  hspi1.Init.MasterReceiverAutoSusp = SPI_MASTER_RX_AUTOSUSP_DISABLE;
  hspi1.Init.MasterKeepIOState = SPI_MASTER_KEEP_IO_STATE_DISABLE;
  hspi1.Init.IOSwap = SPI_IO_SWAP_DISABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN SPI1_Init 2 */

  /* USER CODE END SPI1_Init 2 */

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

    // Initialize motor variables
    float motor1_pos = 0.0f;
    float motor1_spd = 0.0f;
    float motor1_cur = 0.0f;
    uint8_t motor1_temp = 0;
    uint8_t motor1_error = 0;

    float motor2_pos = 0.0f;
    float motor2_spd = 0.0f;
    float motor2_cur = 0.0f;
    uint8_t motor2_temp = 0;
    uint8_t motor2_error = 0;

    float motor3_pos = 0.0f;
    float motor3_spd = 0.0f;
    float motor3_cur = 0.0f;
    uint8_t motor3_temp = 0;
    uint8_t motor3_error = 0;

    for (;;)
    {
        uint8_t comm_can_extract_controller_id(uint32_t ext_id)
        {
            return (uint8_t)(ext_id & 0xFF);
        }
        uint8_t received_controller_id = comm_can_extract_controller_id(RxHeader.Identifier);

        if (received_controller_id == 1)
        {
            motor_receive(&motor1_pos, &motor1_spd, &motor1_cur, &motor1_temp, &motor1_error);
        }
        else if (received_controller_id == 2)
        {
            motor_receive(&motor2_pos, &motor2_spd, &motor2_cur, &motor2_temp, &motor2_error);
        }
        else if (received_controller_id == 3)
        {
            motor_receive(&motor3_pos, &motor3_spd, &motor3_cur, &motor3_temp, &motor3_error);
        }

        cJSON *root = cJSON_CreateObject();

        // Convert numbers to strings using sprintf
        char *eversionStr = pvPortMalloc(15 * sizeof(char));
        char *dorsiflexionStr = pvPortMalloc(15 * sizeof(char));
        char *extensionStr = pvPortMalloc(15 * sizeof(char));

        sprintf(eversionStr, "%.2f", motor1_pos);
        sprintf(dorsiflexionStr, "%.2f", motor2_pos);
        sprintf(extensionStr, "%.2f", motor3_pos);

        // Add strings to the JSON object
        cJSON_AddStringToObject(root, "dorsiflexion", dorsiflexionStr);
        cJSON_AddStringToObject(root, "eversion", eversionStr);
        cJSON_AddStringToObject(root, "extension", extensionStr);

        // Print the JSON object
        char *jsonMessage = cJSON_PrintUnformatted(root);

        // Send JSON string over UART
        HAL_UART_Transmit(&huart3, (uint8_t *)jsonMessage, strlen(jsonMessage), HAL_MAX_DELAY);

        free(jsonMessage);
        cJSON_Delete(root);  // Correct way to free cJSON memory

        // Free dynamically allocated cJSON strings
        vPortFree(eversionStr);
        vPortFree(dorsiflexionStr);
        vPortFree(extensionStr);

        // Free the JSON string

        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
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

	  char* foundWord = searchWord((char*) MainBuf_UART);

	  if (strcmp(foundWord, "eversionR") == 0) {
	      p_in_1 -= p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 += p_step;
	      comm_can_set_pos(2, p_in_2);


	  }
	  else if (strcmp(foundWord, "eversionL") == 0) {
	      p_in_1 += p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 -= p_step;
	      comm_can_set_pos(2, p_in_2);

	  }
	  else if (strcmp(foundWord, "dorsiflexionU") == 0) {
	      p_in_1 += p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 += p_step;
	      comm_can_set_pos(2, p_in_2);

	  }
	  else if (strcmp(foundWord, "dorsiflexionD") == 0) {
	      p_in_1 -= p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 -= p_step;
	      comm_can_set_pos(2, p_in_2);

	  }
	  else if (strcmp(foundWord, "extensionU") == 0) {
	      p_in_3 += p_step;
	      comm_can_set_pos(3, p_in_3);

	  }
	  else if (strcmp(foundWord, "extensionD") == 0) {
	      p_in_3 -= p_step;
	      comm_can_set_pos(3, p_in_3);

	  }
	  else if (strcmp(foundWord, "motor1H") == 0) {

	      p_in_1 -= p_step;
	      comm_can_set_pos(1, p_in_1);

	  }
	  else if (strcmp(foundWord, "motor1AH") == 0) {

	      p_in_1 += p_step;
	      comm_can_set_pos(1, p_in_1);

	  }
	  else if (strcmp(foundWord, "motor2H") == 0) {

	      p_in_2 -= p_step;
	      comm_can_set_pos(2, p_in_2);

	  }
	  else if (strcmp(foundWord, "motor2AH") == 0) {

	      p_in_2 += p_step;
	      comm_can_set_pos(2, p_in_2);

	  }
	  else if (strcmp(foundWord, "motor3H") == 0) {

	      p_in_3 -= p_step;
	      comm_can_set_pos(3, p_in_3);

	  }
	  else if (strcmp(foundWord, "motor3AH") == 0) {

	      p_in_3 += p_step;
	      comm_can_set_pos(3, p_in_3);

	  }
	  else if (strcmp(foundWord, "goHome1") == 0) {

		  comm_can_set_pos_spd(1, 0.0, 500, 1000);
	      p_in_1 = 0.0;

	  }
	  else if (strcmp(foundWord, "goHome2") == 0) {

		  comm_can_set_pos_spd(2, 0.0, 1000, 1000);
	      p_in_2 = 0.0;

	  }
	  else if (strcmp(foundWord, "goHome3") == 0) {

		  comm_can_set_pos_spd(3, 0.0, 1000, 1000);
	       p_in_3 = 0.0;

	  }
	  else if (strcmp(foundWord, "setHome") == 0) {

			comm_can_set_origin(1);
			comm_can_set_origin(2);
			comm_can_set_origin(3);


	  }
	  else if (strcmp(foundWord, "goHome") == 0) {

		  comm_can_set_pos_spd(1, 0.0, 1000, 1000);
		  comm_can_set_pos_spd(2, 0.0, 1000, 1000);
		  comm_can_set_pos_spd(3, 0.0, 1000, 1000);

	  }


	  vTaskDelay(100 / portTICK_PERIOD_MS);

  }
  /* USER CODE END ReceiveHMITask */
}

/* USER CODE BEGIN Header_SDCard_Task */
/**
* @brief Function implementing the SDCard thread.
* @param argument: Not used
* @retval None
*/
/* USER CODE END Header_SDCard_Task */
void SDCard_Task(void const * argument)
{
  /* USER CODE BEGIN SDCard_Task */
    /* Infinite loop */
    for (;;)
    {
//        char buffer[50];
//        snprintf(buffer, sizeof(buffer), "1. %.2f 2. %.2f 3. %.2f", (double)p_in_1, (double)p_in_2, (double)p_in_3);
//
//        Mount_SD("/");
//        Update_File("home.txt", buffer);
//        Unmount_SD("/");

//        vTaskDelay(1000 / portTICK_PERIOD_MS);
    	  vTaskDelay(1 / portTICK_PERIOD_MS);
    }
  /* USER CODE END SDCard_Task */
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
