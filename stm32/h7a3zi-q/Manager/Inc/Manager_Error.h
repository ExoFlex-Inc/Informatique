#ifndef MANAGER_ERROR_H
#define MANAGER_ERROR_H

#include <stdint.h>

// Error bit definitions

#define ERROR_0_MSEC (1U << 0)
#define ERROR_1_MHMI (1U << 1)
#define ERROR_2_MMOT (1U << 2)
#define ERROR_3_MMOV (1U << 3)

#define ERROR_4_LS_EXT_UP     (1U << 4)
#define ERROR_5_LS_EXT_DOWN   (1U << 5)
#define ERROR_6_LS_LEFT       (1U << 6)
#define ERROR_7_LS_RIGHT      (1U << 7)
#define ERROR_8_LS_EVER_UP    (1U << 8)
#define ERROR_9_LS_EVER_DOWN  (1U << 9)
#define ERROR_10_LS_DORS_UP   (1U << 10)
#define ERROR_11_LS_DORS_DOWN (1U << 11)

#define ERROR_12_CYCLEMS (1U << 12)

//#define ERROR_13

#define ERROR_14_MMOT_CAN_CONNECT   (1U << 14)
#define ERROR_15_MMOT_CAN_MAX_DELAY (1U << 15)
#define ERROR_16_MMOT_SET_ORIGIN    (1U << 16)

#define ERROR_17_MOTOR_1 (1U << 17)
#define ERROR_18_MOTOR_2 (1U << 18)
#define ERROR_19_MOTOR_3 (1U << 19)

#define ERROR_20_MMOT_MINMAX_POS    (1U << 20)
#define ERROR_21_MMOT_MINMAX_TORQUE (1U << 21)
#define ERROR_22_MMOT_MINMAX_SPEED  (1U << 22)

// Add more errors as needed, up to bit 31.

// Function declarations
void ManagerError_Init();

// Sets the specified error bit in the error register
void ManagerError_SetError(uint32_t errorBit);

// Clears the specified error bit in the error register
void ManagerError_ClearError(uint32_t errorBit);

// Checks if the specified error bit is set
uint8_t ManagerError_IsErrorSet(uint32_t errorBit);

// Resets all errors (clears the entire error register)
void ManagerError_ResetAllErrors(void);

// Returns the current error status
uint32_t ManagerError_GetErrorStatus(void);

#endif  // MANAGER_ERROR_H
