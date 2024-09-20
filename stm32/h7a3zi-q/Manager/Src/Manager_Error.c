#include "Manager_Error.h"

// Static variable to store the current error status
uint32_t errorStatus = 0;


void ManagerError_Init()
{
	errorStatus = 0;
}

// Sets the specified error bit in the error register
void ManagerError_SetError(uint32_t errorBit)
{
    errorStatus |= errorBit;
}

// Clears the specified error bit in the error register
void ManagerError_ClearError(uint32_t errorBit)
{
    errorStatus &= ~errorBit;
}

// Checks if the specified error bit is set
uint8_t ManagerError_IsErrorSet(uint32_t errorBit)
{
    return (errorStatus & errorBit) != 0;
}

// Resets all errors (clears the entire error register)
void ManagerError_ResetAllErrors(void)
{
    errorStatus = 0;
}

// Returns the current error status
uint32_t ManagerError_GetErrorStatus(void)
{
    return errorStatus;
}
