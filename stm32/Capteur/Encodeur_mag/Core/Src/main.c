/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 STMicroelectronics.
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

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <string.h>
#include <stdio.h>
#include <stdbool.h>

#include "as5600.h"


/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
ADC_HandleTypeDef hadc1;

I2C_HandleTypeDef hi2c1;
#define AS5600_I2C &hi2c1

USART_HandleTypeDef husart2;

/* USER CODE BEGIN PV */
static const uint8_t AS5600 = 0x36 << 1;

static const uint8_t ZPOS = 0x01;

static const uint8_t RAW_ANGLE = 0x0C;

static const uint8_t ANGLE = 0x0E;

static const uint8_t MANG = 0x05;

static const uint8_t MPOS = 0x03;

static const uint8_t BURN_ANGLE = 0x80;
static const uint8_t BURN_SETTINGS = 0x40;
static const uint8_t BURN = 0xFF;

static const uint8_t STATUS = 0x0B;

uint16_t angle=0;
char msg[20];

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_ADC1_Init(void);
static void MX_I2C1_Init(void);
static void MX_USART2_Init(void);
/* USER CODE BEGIN PFP */
uint32_t const my_i2c_xfer(uint8_t const, uint8_t const * const, size_t const, uint8_t * const,size_t const);
/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* USER CODE BEGIN 1 */
	uint16_t raw_angle;

	uint16_t raw_data;
	uint16_t lowbyte;
	uint16_t highbyte;
	HAL_StatusTypeDef ret;
	uint16_t buf[12];
	int16_t val;

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_ADC1_Init();
  MX_I2C1_Init();
  MX_USART2_Init();
  /* USER CODE BEGIN 2 */
  as5600_error_t result = as5600_init(my_i2c_xfer);

  //Configuration des capteurs en i2c

  //	  Step 1 : Power up the AS5600
  //	  Step 2 : Turn the magnet to start position
  //	  Step 3 : Read RAW_ANGLE register

//  static const uint8_t maxAngleMsb = 0x04;
//  static const uint8_t maxAngleLsb = 0x00;
//
//  const uint8_t mang[2] = {maxAngleMsb, maxAngleLsb};
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, MANG, 1, mang, 2, HAL_MAX_DELAY);
//  HAL_Delay(2);
//
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, BURN_SETTINGS, 1, HAL_MAX_DELAY);
//  HAL_Delay(2);
//
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, 0x01, 1, HAL_MAX_DELAY);
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, 0x11, 1, HAL_MAX_DELAY);
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, 0x10, 1, HAL_MAX_DELAY);
//
//  HAL_I2C_Mem_Read(AS5600_I2C, AS5600, MANG, 1, mang, 2, HAL_MAX_DELAY);
//  HAL_USART_Transmit(&husart2,mang, strlen((char*)mang), HAL_MAX_DELAY);
//
//  uint8_t rawAngle[2];
//  HAL_I2C_Mem_Read(AS5600_I2C, AS5600, RAW_ANGLE, 1, rawAngle, 2, HAL_MAX_DELAY);
//  val = ((int16_t)rawAngle[0] << 8 | rawAngle[1]);
//
//  sprintf((char*)rawAngle, "%u C\r\n", (unsigned int)val);
//  HAL_USART_Transmit(&husart2,rawAngle, strlen((char*)rawAngle), HAL_MAX_DELAY);
//
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, ZPOS, 1, rawAngle, 2, HAL_MAX_DELAY);
//
//  HAL_Delay(2);
//
//  HAL_I2C_Mem_Read(AS5600_I2C, AS5600, RAW_ANGLE, 1, rawAngle, 2, HAL_MAX_DELAY);
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, MPOS, 1, rawAngle, 2, HAL_MAX_DELAY);
//  HAL_Delay(2);
//
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, BURN_ANGLE, 1, HAL_MAX_DELAY);
//  HAL_Delay(2);
//
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, 0x01, 1, HAL_MAX_DELAY);
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, 0x11, 1, HAL_MAX_DELAY);
//  HAL_I2C_Mem_Write(AS5600_I2C, AS5600, BURN, 1, 0x10, 1, HAL_MAX_DELAY);
//  HAL_I2C_Mem_Read(AS5600_I2C, AS5600, ZPOS, 1, rawAngle, 2, HAL_MAX_DELAY);
//  HAL_USART_Transmit(&husart2,rawAngle, strlen((char*)rawAngle), HAL_MAX_DELAY);
//
//  HAL_I2C_Mem_Read(AS5600_I2C, AS5600, MPOS, 1, rawAngle, 2, HAL_MAX_DELAY);
//  HAL_USART_Transmit(&husart2,rawAngle, strlen((char*)rawAngle), HAL_MAX_DELAY);


  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
	  //Test seulement les valeurs raw analogique
	  HAL_ADC_Start(&hadc1);
	  HAL_ADC_PollForConversion(&hadc1, 20);
	  angle = HAL_ADC_GetValue(&hadc1);
	  sprintf(msg, "Angle: %hu \r\n", angle);
	  HAL_USART_Transmit(&husart2, (uint8_t *)msg, strlen(msg), HAL_MAX_DELAY);
	  HAL_Delay(200);

	  //Ancien code i2c pour test

	  // Know the value of the raw angle at this moment
//	  as5600_get_raw_angle(&raw_angle);

	  // Convert to string and print
//  	  uint8_t rawAngle[2];
//  	  HAL_I2C_Mem_Read(AS5600_I2C, AS5600, ANGLE, 1, rawAngle, 2, HAL_MAX_DELAY);
//  	  val = ((int16_t)rawAngle[0] << 8 | rawAngle[1]);
//
//	  sprintf((char*)buf, "%hu\r\n", val);
//	  HAL_USART_Transmit(&husart2, buf, strlen((char*)buf), HAL_MAX_DELAY);

//	  HAL_Delay(3000);

//	  as5600_get_angle(&angle);

//	  sprintf((char*)buf, "%hu\r\n", angle);
//	  HAL_USART_Transmit(&husart2, buf, strlen((char*)buf), HAL_MAX_DELAY);

//	  HAL_Delay(100);
//
//	  as5600_error_t as5600_set_start_position(uint16_t const start_position);
//
//	  HAL_Delay(2);
//
//	  as5600_error_t as5600_get_start_position(uint16_t * const p_start_position);

	  // Convert to string and print
//	  sprintf((char*)buf, "%hu\r\n", raw_data);
//	  HAL_USART_Transmit(&husart2, buf, strlen((char*)buf), HAL_MAX_DELAY);
//
//	  HAL_Delay(5000);

	  // Turn the magnet in the CCW direction to reach the final position

	  // Know the value of the raw angle at this moment
//	  as5600_error_t as5600_get_raw_angle(uint16_t * const p_raw_angle);

	  // Convert to string and print
//	  sprintf((char*)buf, "%hu\r\n", raw_data);
//	  HAL_USART_Transmit(&husart2, buf, strlen((char*)buf), HAL_MAX_DELAY);
//
//	  HAL_Delay(3000);

//	  as5600_error_t as5600_set_stop_position(uint16_t const stop_position);
//
//	  HAL_Delay(2);
//
//	  as5600_error_t as5600_get_stop_position(uint16_t * const stop_position);

	  // Convert to string and print
//	  sprintf((char*)buf, "%hu\r\n", raw_data);
//	  HAL_USART_Transmit(&husart2, buf, strlen((char*)buf), HAL_MAX_DELAY);
//
//	  HAL_Delay(3000);
//	  as5600_error_t as5600_set_output_stage(as5600_output_stage_t const output_stage, as5600_configuration_t * const p_config);


//////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////
//
//	  HAL_USART_Transmit(&husart2,buf, strlen((char*)buf), HAL_MAX_DELAY);


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
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_MSI;
  RCC_OscInitStruct.MSIState = RCC_MSI_ON;
  RCC_OscInitStruct.MSICalibrationValue = 0;
  RCC_OscInitStruct.MSIClockRange = RCC_MSIRANGE_6;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_NONE;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_MSI;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV1;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_0) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief ADC1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_ADC1_Init(void)
{

  /* USER CODE BEGIN ADC1_Init 0 */

  /* USER CODE END ADC1_Init 0 */

  ADC_ChannelConfTypeDef sConfig = {0};

  /* USER CODE BEGIN ADC1_Init 1 */

  /* USER CODE END ADC1_Init 1 */

  /** Common config
  */
  hadc1.Instance = ADC1;
  hadc1.Init.ClockPrescaler = ADC_CLOCK_ASYNC_DIV1;
  hadc1.Init.Resolution = ADC_RESOLUTION_12B;
  hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
  hadc1.Init.ScanConvMode = ADC_SCAN_DISABLE;
  hadc1.Init.EOCSelection = ADC_EOC_SINGLE_CONV;
  hadc1.Init.LowPowerAutoWait = DISABLE;
  hadc1.Init.ContinuousConvMode = DISABLE;
  hadc1.Init.NbrOfConversion = 1;
  hadc1.Init.DiscontinuousConvMode = DISABLE;
  hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
  hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
  hadc1.Init.DMAContinuousRequests = DISABLE;
  hadc1.Init.Overrun = ADC_OVR_DATA_PRESERVED;
  hadc1.Init.OversamplingMode = DISABLE;
  if (HAL_ADC_Init(&hadc1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Regular Channel
  */
  sConfig.Channel = ADC_CHANNEL_5;
  sConfig.Rank = ADC_REGULAR_RANK_1;
  sConfig.SamplingTime = ADC_SAMPLETIME_2CYCLES_5;
  sConfig.SingleDiff = ADC_SINGLE_ENDED;
  sConfig.OffsetNumber = ADC_OFFSET_NONE;
  sConfig.Offset = 0;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN ADC1_Init 2 */

  /* USER CODE END ADC1_Init 2 */

}

/**
  * @brief I2C1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_I2C1_Init(void)
{

  /* USER CODE BEGIN I2C1_Init 0 */

  /* USER CODE END I2C1_Init 0 */

  /* USER CODE BEGIN I2C1_Init 1 */

  /* USER CODE END I2C1_Init 1 */
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x00000E14;
  hi2c1.Init.OwnAddress1 = 0;
  hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
  hi2c1.Init.OwnAddress2 = 0;
  hi2c1.Init.OwnAddress2Masks = I2C_OA2_NOMASK;
  hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
  hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
  if (HAL_I2C_Init(&hi2c1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Analogue filter
  */
  if (HAL_I2CEx_ConfigAnalogFilter(&hi2c1, I2C_ANALOGFILTER_ENABLE) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Digital filter
  */
  if (HAL_I2CEx_ConfigDigitalFilter(&hi2c1, 0) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN I2C1_Init 2 */

  /* USER CODE END I2C1_Init 2 */

}

/**
  * @brief USART2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART2_Init(void)
{

  /* USER CODE BEGIN USART2_Init 0 */

  /* USER CODE END USART2_Init 0 */

  /* USER CODE BEGIN USART2_Init 1 */

  /* USER CODE END USART2_Init 1 */
  husart2.Instance = USART2;
  husart2.Init.BaudRate = 115200;
  husart2.Init.WordLength = USART_WORDLENGTH_8B;
  husart2.Init.StopBits = USART_STOPBITS_1;
  husart2.Init.Parity = USART_PARITY_NONE;
  husart2.Init.Mode = USART_MODE_TX_RX;
  husart2.Init.CLKPolarity = USART_POLARITY_LOW;
  husart2.Init.CLKPhase = USART_PHASE_1EDGE;
  husart2.Init.CLKLastBit = USART_LASTBIT_DISABLE;
  if (HAL_USART_Init(&husart2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART2_Init 2 */

  /* USER CODE END USART2_Init 2 */

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
/* USER CODE BEGIN MX_GPIO_Init_1 */
/* USER CODE END MX_GPIO_Init_1 */

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

/* USER CODE BEGIN MX_GPIO_Init_2 */
/* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */


uint32_t const my_i2c_xfer(uint8_t const slave_address,
                           uint8_t const * const p_tx_buffer,
                           size_t const tx_buffer_size,
                           uint8_t * const p_rx_buffer,
                           size_t const rx_buffer_size)
{

        uint32_t const timeout = 100;
        HAL_StatusTypeDef result = HAL_OK;
        bool is_rx_operation = true;

        if ((NULL == p_tx_buffer) || (0 == tx_buffer_size)) {
                result = HAL_ERROR;

        } else if ((NULL == p_rx_buffer) || (0 == rx_buffer_size)) {
                is_rx_operation = false;
        }

        if (HAL_OK == result) {
                // TX operation
                result = HAL_I2C_Master_Transmit(&hi2c1,
                                                 slave_address,
                                                 p_tx_buffer,
                                                 (uint16_t)tx_buffer_size,
                                                 timeout);
        }

        if ((HAL_OK == result) && (is_rx_operation)) {
                // RX operation
                result = HAL_I2C_Master_Receive(&hi2c1,
                                                slave_address,
                                                p_rx_buffer,
                                                rx_buffer_size,
                                                timeout);
        }

        return result;
}

//void mag_enc_analog(void)
//{
//	  HAL_GPIO_WritePin(GPIOA, GPIO_PIN_12, GPIO_PIN_SET);
//
//	  // Get ADC value
//	  HAL_ADC_Start(&hadc1);
//	  HAL_ADC_PollForConversion(&hadc1, HAL_MAX_DELAY);
//	  raw_data = HAL_ADC_GetValue(&hadc1);
//
//	  // Test : Set GPIO pin low
//	  HAL_GPIO_WritePin(GPIOA, GPIO_PIN_12, GPIO_PIN_RESET);
//
//	  // Convert to string and print
//	  sprintf(msg, "%hu\r\n", raw_data);
//	  HAL_USART_Transmit(&husart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
//
//	 //Pretend we have something else to do for a while
//	  HAL_Delay(1);
//}
/* USER CODE END 4 */

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
