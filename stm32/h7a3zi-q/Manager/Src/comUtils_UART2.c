#include <stdlib.h>

#include "stm32h7xx_hal.h"
#include "string.h"
#include "uartRingBufDMA.h"

extern UART_HandleTypeDef huart2;
extern DMA_HandleTypeDef  hdma_usart2_rx;

#define UART huart2
#define DMA  hdma_usart2_rx

/* Define the Size Here */
#define MAINBUF_UART2_SIZE 1024

extern uint8_t MainBuf_UART2[MAINBUF_UART2_SIZE];

extern uint16_t newPos_UART2;

/* Timeout is in milliseconds */
extern int32_t TIMEOUT;

char* searchWord(char* buffertocopyfrom)
{
    char*  wordToFind[]    = {"eversionR", "eversionL", "dorsiflexionR",
                              "dorsiflexionL", "extension"};
    char*  closestWord     = NULL;
    size_t closestPosition = SIZE_MAX;

    for (int i = 0; i < 2; i++)
    {
        char* pos = strstr(buffertocopyfrom, wordToFind[i]);
        if (pos != NULL)
        {
            size_t position = pos - buffertocopyfrom;

            if (position < closestPosition)
            {
                closestPosition = position;
                closestWord     = wordToFind[i];
            }
        }
    }

    if (closestWord != NULL)
    {
        // Calculate the length of the found word
        size_t wordLength = strlen(closestWord);

        // Calculate the position after the found word
        size_t afterPosition = closestPosition + wordLength;

        // Calculate the length of the text after the found word
        size_t afterLength = strlen(buffertocopyfrom + afterPosition);

        // Copy the text after the found word and any unfinished word
        memmove(buffertocopyfrom, (char*) MainBuf_UART2 + afterPosition,
                afterLength);

        // Update newPos accordingly
        newPos_UART2 = afterLength;

        // Zero out the rest of the buffer
        memset(buffertocopyfrom + afterLength, 0, afterPosition);

        return closestWord;  // Return the closest found word
    }
    else
    {
        // If no closest word found, clear MainBuf
        memset(buffertocopyfrom, '\0', strlen(buffertocopyfrom));

        // Update newPos accordingly
        newPos_UART2 = 0;
    }
    return NULL;  // Return NULL if no word was found
}
