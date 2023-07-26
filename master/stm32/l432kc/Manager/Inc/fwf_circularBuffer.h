/**
 * @file        fwf_circularBuffer.h
 * @brief		This file contains all the function prototypes for the fwf_circularBuffer.c.
 * @date		2022-06-01 (creation)
 */

#ifndef _CIRCULAR_BUFFER_H_
#define	_CIRCULAR_BUFFER_H_

#ifdef __cplusplus
extern "C" {
#endif

/** @addtogroup CircularBuffer
  * @{
  */
 
/* Includes -------------------------------------------------------------------*/
/** @addtogroup CircularBuffer_Exported_Includes
  * @{
  */
#include <stdint.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <math.h>

#include "fwf_status.h"

/**
  * @}
  */


/* Exported Defines -----------------------------------------------------------*/
/** @addtogroup CircularBuffer_Exported_Defines
  * @{
  */

/**
  * @}
  */


/* Exported Macros ------------------------------------------------------------*/
/** @addtogroup CircularBuffer_Exported_Macros
  * @{
  */ 

/**
  * @}
  */


/* Exported Enumerations ------------------------------------------------------*/
/** @addtogroup CircularBuffer_Exported_Enumerations
  * @{
  */

/**
  * @}
  */


/* Exported Structs -----------------------------------------------------------*/
/** @addtogroup CircularBuffer_Exported_Structures
  * @{
  */
typedef struct
{
    uint8_t *pBuffer;        ///< Circular internal buffer
    int32_t WriteIndex;      ///< Write Index
    int32_t ReadIndex;       ///< Read index
    uint32_t DataCount;      ///< Number of entries in circular buffer
    uint32_t DataSize;       ///< Size of an entry
    int32_t BufferShift;     ///< Shift value for datacount (power of 2 division)
    uint32_t BufferOverflow; ///< Number of times the circular buffer overflown
    bool bIsFull;            ///< Buffer full flag
} sCircularBufferDesc_t;
/**
  * @}
  */


/* Exported constants ---------------------------------------------------------*/
/** @addtogroup CircularBuffer_Exported_Constants
  * @{
  */ 

/**
  * @}
  */


/* Exported functions ---------------------------------------------------------*/
/** @addtogroup CircularBuffer_Exported_Functions
  * @{
  */
eStatus_t CircularBuffer_Init(sCircularBufferDesc_t *const psDesc, uint8_t const *const pBuffer, uint32_t DataSize,
                              uint32_t DataCount);
eStatus_t CircularBuffer_Clear(sCircularBufferDesc_t *const psDesc);
eStatus_t CircularBuffer_GetItemByIndex(sCircularBufferDesc_t const *const psDesc, uint32_t Index, uint8_t **ppItem);
eStatus_t CircularBuffer_GetItem(sCircularBufferDesc_t  *const psDesc, uint8_t **ppItem);
eStatus_t CircularBuffer_AddItem(sCircularBufferDesc_t *const psDesc, uint8_t const *const pItem);
eStatus_t CircularBuffer_GetSize(sCircularBufferDesc_t const *const psDesc, uint32_t *const pSize);
eStatus_t CircularBuffer_GetDataCount(sCircularBufferDesc_t const *const psDesc, uint32_t *const pDataCount);
eStatus_t CircularBuffer_GetDataSize(sCircularBufferDesc_t const *const psDesc, uint32_t *const pDataSize);
eStatus_t CircularBuffer_GetBufOverflow(sCircularBufferDesc_t const *const psDesc, uint32_t *const pOverflow);
eStatus_t CircularBuffer_ResetOverflow(sCircularBufferDesc_t *const psDesc);
eStatus_t CircularBuffer_GetOverflow(sCircularBufferDesc_t const *const psDesc, uint32_t *const pOverflow);
eStatus_t CircularBuffer_IsBufferFull(sCircularBufferDesc_t const *const psDesc, bool *const pbIsFull);


/**
  * @}
  */
/**
  * @}
  */

#ifdef __cplusplus
}
#endif
#endif	/* _CIRCULAR_BUFFER_H_ */
/*****END OF FILE****/
