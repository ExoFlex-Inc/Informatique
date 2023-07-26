/**
 * @file        UtilMacro.h
 * @brief		This file contains general macros utilities.
 * @date		2022-05-04 (creation)
 */

#ifndef _UTIL_MACRO_H_
#define _UTIL_MACRO_H_

#ifdef __cplusplus
extern "C"
{
#endif

/** @addtogroup UtilMacro
 * @{
 */

/* Includes -------------------------------------------------------------------*/
/** @addtogroup UtilMacro_Exported_Includes
 * @{
 */
#include <stdio.h>
/**
 * @}
 */

/* Exported Defines -----------------------------------------------------------*/
/** @addtogroup UtilMacro_Exported_Defines
 * @{
 */

/**
 * @}
 */

/* Exported Macros ------------------------------------------------------------*/
/** @addtogroup UtilMacro_Exported_Macros
 * @{
 */
// Maths
#define MIN(a, b) (((a) < (b)) ? (a) : (b)) /*!< Get the minimum value between a and b */
#define MAX(a, b) (((a) > (b)) ? (a) : (b)) /*!< Get the maximum value between a and b */
#define CLAMP(x, low, high) \
    (((x) > (high)) ? (high) : (((x) < (low)) ? (low) : (x))) /*!< Apply low and high saturation to x */
#define ABS(x)    (((x) < 0) ? -(x) : (x))                    /*!< Get the absolute value of x */
#define Roundf(x) ((int32_t)(x < 0 ? x - 0.5f : x + 0.5f))    /*!< Integer rounding of x */

// Meta
#define _STR_(s)     #s       /*!< Preprocessor string substitution */
#define STRINGIFY(s) _STR_(s) /*!< Preprocessor string substitution */

// array
#define ARRAY_LENGTH(arr) (sizeof(arr) / sizeof(arr[0])) /*!< Get the array length */

// Bits manipulation
#define POPCOUNT __builtin_popcount
#define IS_POWER_OF_2(x) ((x & (x - 1)) == 0)

// Tag
#define UNUSED(x) (void)(x) /*!< To identify unused variable */
#define PACKED __attribute__((packed))

/**
 * @}
 */

/* Exported Enumerations ------------------------------------------------------*/
/** @addtogroup UtilMacro_Exported_Enumerations
 * @{
 */

/**
 * @}
 */

/* Exported Structs -----------------------------------------------------------*/
/** @addtogroup UtilMacro_Exported_Structures
 * @{
 */

/**
 * @}
 */

/* Exported constants ---------------------------------------------------------*/
/** @addtogroup UtilMacro_Exported_Constants
 * @{
 */

/**
 * @}
 */

/* Exported functions ---------------------------------------------------------*/
/** @addtogroup UtilMacro_Exported_Functions
 * @{
 */

/**
 * @}
 */
/**
 * @}
 */

#ifdef __cplusplus
}
#endif
#endif /* _UTIL_MACRO_H_ */
/*****END OF FILE****/
