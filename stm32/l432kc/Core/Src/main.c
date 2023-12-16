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
CAN_HandleTypeDef hcan1;

SPI_HandleTypeDef hspi1;

UART_HandleTypeDef huart2;
DMA_HandleTypeDef hdma_usart2_rx;

/* Definitions for SendJSON */
osThreadId_t SendJSONHandle;
const osThreadAttr_t SendJSON_attributes = {
  .name = "SendJSON",
  .stack_size = 220 * 4,
  .priority = (osPriority_t) osPriorityLow,
};
/* Definitions for ReceiveHMI */
osThreadId_t ReceiveHMIHandle;
const osThreadAttr_t ReceiveHMI_attributes = {
  .name = "ReceiveHMI",
  .stack_size = 128 * 4,
  .priority = (osPriority_t) osPriorityRealtime,
};
/* Definitions for SDCard */
osThreadId_t SDCardHandle;
const osThreadAttr_t SDCard_attributes = {
  .name = "SDCard",
  .stack_size = 220 * 4,
  .priority = (osPriority_t) osPriorityNormal,
};
/* USER CODE BEGIN PV */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_DMA_Init(void);
static void MX_USART2_UART_Init(void);
static void MX_CAN1_Init(void);
static void MX_SPI1_Init(void);
void SendJSONTask(void *argument);
void ReceiveHMITask(void *argument);
void SDCard_Task(void *argument);

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
  MX_USART2_UART_Init();
  MX_CAN1_Init();
  MX_SPI1_Init();
  MX_FATFS_Init();
  /* USER CODE BEGIN 2 */

  Ringbuf_Init();

  HAL_CAN_Start(&hcan1);

  // Activate the notification
  HAL_CAN_ActivateNotification(&hcan1, CAN_IT_RX_FIFO0_MSG_PENDING);

//  Mount_SD("/");
//  char* homeBuff = Read_File("home.txt");
//  parseFileContent(homeBuff, &p_in_1, &p_in_2, &p_in_3);
//  Format_SD();
//  Create_File("home.txt");
//  Unmount_SD("/");

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

  /* creation of SDCard */
  SDCardHandle = osThreadNew(SDCard_Task, NULL, &SDCard_attributes);

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
  RCC_OscInitStruct.PLL.PLLN = 15;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV7;
  RCC_OscInitStruct.PLL.PLLQ = RCC_PLLQ_DIV2;
  RCC_OscInitStruct.PLL.PLLR = RCC_PLLR_DIV4;
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

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_3) != HAL_OK)
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
  hcan1.Init.Prescaler = 24;
  hcan1.Init.Mode = CAN_MODE_NORMAL;
  hcan1.Init.SyncJumpWidth = CAN_SJW_1TQ;
  hcan1.Init.TimeSeg1 = CAN_BS1_2TQ;
  hcan1.Init.TimeSeg2 = CAN_BS2_2TQ;
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
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_16;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 7;
  hspi1.Init.CRCLength = SPI_CRC_LENGTH_DATASIZE;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN SPI1_Init 2 */

  /* USER CODE END SPI1_Init 2 */

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
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0|LD3_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin : PA5 */
  GPIO_InitStruct.Pin = GPIO_PIN_5;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

  /*Configure GPIO pins : PB0 LD3_Pin */
  GPIO_InitStruct.Pin = GPIO_PIN_0|LD3_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);

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
        uint8_t comm_can_extract_controller_id(uint32_t ext_id)
        {
            return (uint8_t)(ext_id & 0xFF);
        }
        uint8_t received_controller_id = comm_can_extract_controller_id(RxHeader.ExtId);

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
        HAL_UART_Transmit(&huart2, (uint8_t *)jsonMessage, strlen(jsonMessage), HAL_MAX_DELAY);

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
void SDCard_Task(void *argument)
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
