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
#include "CAN_Motor_Servo.h"

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
CAN_HandleTypeDef hcan1;

UART_HandleTypeDef huart2;
DMA_HandleTypeDef hdma_usart2_rx;

/* Definitions for SendJSON */
osThreadId_t SendJSONHandle;
const osThreadAttr_t SendJSON_attributes = {
  .name = "SendJSON",
  .stack_size = 256 * 4,
  .priority = (osPriority_t) osPriorityLow1,
};
/* Definitions for ReceiveHMI */
osThreadId_t ReceiveHMIHandle;
const osThreadAttr_t ReceiveHMI_attributes = {
  .name = "ReceiveHMI",
  .stack_size = 128 * 4,
  .priority = (osPriority_t) osPriorityHigh,
};
/* Definitions for CanCom */
osThreadId_t CanComHandle;
const osThreadAttr_t CanCom_attributes = {
  .name = "CanCom",
  .stack_size = 128 * 4,
  .priority = (osPriority_t) osPriorityHigh,
};
/* Definitions for SerialDetect */
osThreadId_t SerialDetectHandle;
const osThreadAttr_t SerialDetect_attributes = {
  .name = "SerialDetect",
  .stack_size = 128 * 4,
  .priority = (osPriority_t) osPriorityRealtime,
};
/* USER CODE BEGIN PV */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_DMA_Init(void);
static void MX_USART2_UART_Init(void);
static void MX_CAN1_Init(void);
void SendJSONTask(void *argument);
void ReceiveHMITask(void *argument);
void CanComTask(void *argument);
void SerialDetectTask(void *argument);

/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

// COM Variables
#define MainBuf_UART2_SIZE 1024

extern uint8_t MainBuf_UART2[MainBuf_UART2_SIZE];

extern char id[20];

CAN_TxHeaderTypeDef TxHeader;
CAN_RxHeaderTypeDef RxHeader;
CAN_FilterTypeDef canfilterconfig;


uint8_t TxData[8];
uint8_t RxData[8];

uint32_t TxMailbox;

// Motor values
float p_in_1;
float p_in_2;
float p_in_3;

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
  MX_USART2_UART_Init();
  MX_CAN1_Init();
  /* USER CODE BEGIN 2 */

  Ringbuf_Init();

  HAL_CAN_Start(&hcan1);

  // Activate the notification
  HAL_CAN_ActivateNotification(&hcan1, CAN_IT_RX_FIFO0_MSG_PENDING);


//  HAL_UART_Transmit(&huart1, (uint8_t *)"AT+RST\r\n", 8, 1000);
//  while (ESP_Init("dlink08", "78542e0651a0") != 1)
//  {
//
//  }

  /* USER CODE END 2 */

  /* Init scheduler */
  osKernelInitialize();

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
  /* creation of SendJSON */
  SendJSONHandle = osThreadNew(SendJSONTask, NULL, &SendJSON_attributes);

  /* creation of ReceiveHMI */
  ReceiveHMIHandle = osThreadNew(ReceiveHMITask, NULL, &ReceiveHMI_attributes);

  /* creation of CanCom */
  CanComHandle = osThreadNew(CanComTask, NULL, &CanCom_attributes);

  /* creation of SerialDetect */
  SerialDetectHandle = osThreadNew(SerialDetectTask, NULL, &SerialDetect_attributes);

  /* USER CODE BEGIN RTOS_THREADS */
  /* add threads, ... */
  /* USER CODE END RTOS_THREADS */

  /* USER CODE BEGIN RTOS_EVENTS */
  /* add events, ... */
  /* USER CODE END RTOS_EVENTS */

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

  /** Configure the main internal regulator output voltage
  */
  if (HAL_PWREx_ControlVoltageScaling(PWR_REGULATOR_VOLTAGE_SCALE1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
  RCC_OscInitStruct.PLL.PLLM = 1;
  RCC_OscInitStruct.PLL.PLLN = 10;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV7;
  RCC_OscInitStruct.PLL.PLLQ = RCC_PLLQ_DIV2;
  RCC_OscInitStruct.PLL.PLLR = RCC_PLLR_DIV2;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV1;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_4) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief CAN1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_CAN1_Init(void)
{

  /* USER CODE BEGIN CAN1_Init 0 */

  /* USER CODE END CAN1_Init 0 */

  /* USER CODE BEGIN CAN1_Init 1 */

  /* USER CODE END CAN1_Init 1 */
  hcan1.Instance = CAN1;
  hcan1.Init.Prescaler = 40;
  hcan1.Init.Mode = CAN_MODE_NORMAL;
  hcan1.Init.SyncJumpWidth = CAN_SJW_1TQ;
  hcan1.Init.TimeSeg1 = CAN_BS1_2TQ;
  hcan1.Init.TimeSeg2 = CAN_BS2_1TQ;
  hcan1.Init.TimeTriggeredMode = DISABLE;
  hcan1.Init.AutoBusOff = DISABLE;
  hcan1.Init.AutoWakeUp = DISABLE;
  hcan1.Init.AutoRetransmission = DISABLE;
  hcan1.Init.ReceiveFifoLocked = DISABLE;
  hcan1.Init.TransmitFifoPriority = DISABLE;
  if (HAL_CAN_Init(&hcan1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN CAN1_Init 2 */

  canfilterconfig.FilterActivation = CAN_FILTER_ENABLE;
  canfilterconfig.FilterBank = 10;  // which filter bank to use from the assigned ones
  canfilterconfig.FilterFIFOAssignment = CAN_FILTER_FIFO0;
  canfilterconfig.FilterIdHigh = 0;
  canfilterconfig.FilterIdLow = 0;
  canfilterconfig.FilterMaskIdHigh = 0;
  canfilterconfig.FilterMaskIdLow = 0;
  canfilterconfig.FilterMode = CAN_FILTERMODE_IDMASK;
  canfilterconfig.FilterScale = CAN_FILTERSCALE_32BIT;
  canfilterconfig.SlaveStartFilterBank = 20;  // how many filters to assign to the CAN1 (master can)

  HAL_CAN_ConfigFilter(&hcan1, &canfilterconfig);

  /* USER CODE END CAN1_Init 2 */

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
  huart2.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART2_Init 2 */

  /* USER CODE END USART2_Init 2 */

}

/**
  * Enable DMA controller clock
  */
static void MX_DMA_Init(void)
{

  /* DMA controller clock enable */
  __HAL_RCC_DMA1_CLK_ENABLE();

  /* DMA interrupt init */
  /* DMA1_Channel6_IRQn interrupt configuration */
  HAL_NVIC_SetPriority(DMA1_Channel6_IRQn, 5, 0);
  HAL_NVIC_EnableIRQ(DMA1_Channel6_IRQn);

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
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(LD3_GPIO_Port, LD3_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin : PA5 */
  GPIO_InitStruct.Pin = GPIO_PIN_5;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

  /*Configure GPIO pin : LD3_Pin */
  GPIO_InitStruct.Pin = LD3_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(LD3_GPIO_Port, &GPIO_InitStruct);

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
void SendJSONTask(void *argument)
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
	  uint8_t comm_can_extract_controller_id(uint32_t ext_id) {
	      return (uint8_t)(ext_id & 0xFF);
	  }
	  uint8_t received_controller_id = comm_can_extract_controller_id(RxHeader.ExtId);

	if (received_controller_id == 1) {

		motor_receive(&motor1_pos, &motor1_spd, &motor1_cur, &motor1_temp, &motor1_error);

	} else if (received_controller_id == 2) {

		motor_receive(&motor2_pos, &motor2_spd, &motor2_cur, &motor2_temp, &motor2_error);

	} else if (received_controller_id == 3) {

		motor_receive(&motor3_pos, &motor3_spd, &motor3_cur, &motor3_temp, &motor3_error);

	}

	cJSON *root = cJSON_CreateObject();

	// Convert numbers to strings using sprintf
	char dorsiflexionStr[20];
	char eversionStr[20];
	char extensionStr[20];


	sprintf(eversionStr, "%.2f", motor1_pos);
	sprintf(dorsiflexionStr, "%.2f", motor2_pos);
	sprintf(extensionStr, "%.2f", motor3_pos);

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
void ReceiveHMITask(void *argument)
{
  /* USER CODE BEGIN ReceiveHMITask */
  /* Infinite loop */
  for(;;)
  {
	  float p_step = 0.1;

	  char* foundWord = searchWord((char*) MainBuf_UART2);


	  if (strcmp(foundWord, "eversionR") == 0) {
	      p_in_1 -= p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 += p_step;
//	      comm_can_set_pos(2, p_in_1);

	  }
	  else if (strcmp(foundWord, "eversionL") == 0) {
	      p_in_1 += p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 -= p_step;
	      comm_can_set_pos(2, p_in_1);

	  }
	  else if (strcmp(foundWord, "dorsiflexionU") == 0) {
	      p_in_1 += p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 += p_step;
	      comm_can_set_pos(2, p_in_1);

	  }
	  else if (strcmp(foundWord, "dorsiflexionD") == 0) {
	      p_in_1 -= p_step;
	      comm_can_set_pos(1, p_in_1);

	      p_in_2 -= p_step;
	      comm_can_set_pos(2, p_in_1);

	  }
	  else if (strcmp(foundWord, "extensionU") == 0) {
	      p_in_3 += p_step;
	      comm_can_set_pos(3, p_in_3);

	  }
	  else if (strcmp(foundWord, "extensionD") == 0) {
	      p_in_3 -= p_step;
	      comm_can_set_pos(3, p_in_3);

	  }



	  vTaskDelay(100 / portTICK_PERIOD_MS);

  }
  vTaskDelete(NULL);
  /* USER CODE END ReceiveHMITask */
}

/* USER CODE BEGIN Header_CanComTask */
/**
* @brief Function implementing the CanCom thread.
* @param argument: Not used
* @retval None
*/
/* USER CODE END Header_CanComTask */
void CanComTask(void *argument)
{
  /* USER CODE BEGIN CanComTask */
  /* Infinite loop */
  for(;;)
  {
	  //Servo Mode
//	  comm_can_set_pos_spd(1, 360, 5000, 30000);

	  vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
  vTaskDelete(NULL);
  /* USER CODE END CanComTask */
}

/* USER CODE BEGIN Header_SerialDetectTask */
/**
* @brief Function implementing the SerialDetect thread.
* @param argument: Not used
* @retval None
*/
/* USER CODE END Header_SerialDetectTask */
void SerialDetectTask(void *argument)
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
