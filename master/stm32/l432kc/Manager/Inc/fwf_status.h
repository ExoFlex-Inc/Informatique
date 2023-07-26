/**
 * @file        Status.h
 * @brief		This file contains utilities for function return status and safe programming macros.
 * @date		2022-05-04 (creation)
 */

#ifndef _STATUS_H_
#define _STATUS_H_

#ifdef __cplusplus
extern "C"
{
#endif

/** @addtogroup Status
 * @{
 */

/* Includes -------------------------------------------------------------------*/
/** @addtogroup Status_Exported_Includes
 * @{
 */

/**
 * @}
 */

/* Exported Defines -----------------------------------------------------------*/
/** @addtogroup Status_Exported_Defines
 * @{
 */

/**
 * @}
 */

/* Exported Macros ------------------------------------------------------------*/
/** @addtogroup Status_Exported_Macros
 * @{
 */
// Safe programming helper
/**
 * @brief		Safe programming function call
 */

#ifdef VERBOSE_DEBUG
#define RETURN_IF_ERROR(cond)                                             \
    if ((cond) != STATUS_SUCCESS)                                           \
    {                                                                     \
        printf("Internal error at %s, line %d.\r\n", __FILE__, __LINE__); \
        while (1)                                                         \
        {                                                                 \
        }                                                                 \
        return STATUS_ERROR;                                              \
    };
#else
#define RETURN_IF_ERROR(cond)   \
	if ((cond) != STATUS_SUCCESS) \
    {                           \
    							\
        return STATUS_ERROR;    \
    };
#endif
/**
 * @brief		Safe programming null check
 */
#define RETURN_IF_NULL(param) \
    if ((param) == NULL)      \
    {                         \
        return STATUS_ERROR;  \
    };

/**
 * @brief		Safe programming enum max ID check
 */
#define RETURN_IF_INVALID_ENUM(EnumID, MaxID) \
    if ((EnumID) >= (MaxID))                  \
    {                                         \
        return STATUS_ERROR;                  \
    };

/**
 * @}
 */

/* Exported Enumerations ------------------------------------------------------*/
/** @addtogroup Status_Exported_Enumerations
 * @{
 */

/**
 * @brief		Return value enumeration for function
 */
typedef enum
{
    STATUS_SUCCESS = 0,
    STATUS_ERROR   = 1,

    MAX_ID_STATUS,
} eStatus_t;

/**
 * @}
 */

/* Exported Structs -----------------------------------------------------------*/
/** @addtogroup Status_Exported_Structures
 * @{
 */

/**
 * @}
 */

/* Exported constants ---------------------------------------------------------*/
/** @addtogroup Status_Exported_Constants
 * @{
 */

/**
 * @}
 */

/* Exported functions ---------------------------------------------------------*/
/** @addtogroup Status_Exported_Functions
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
#endif /* _STATUS_H_ */
/*****END OF FILE****/
