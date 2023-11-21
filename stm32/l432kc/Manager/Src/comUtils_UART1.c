#include <stdlib.h>

#include "stm32l4xx_hal.h"
#include "string.h"
#include "uartRingBufDMA.h"

extern UART_HandleTypeDef huart1;
extern DMA_HandleTypeDef  hdma_usart1_rx;

#define UART huart2
#define DMA  hdma_usart2_rx

/* Define the Size Here */
#define MAINBUF_UART1_SIZE 1024

extern uint16_t Head_UART1, Tail_UART1;

extern uint8_t MainBuf_UART1[MAINBUF_UART1_SIZE];

extern int isDataAvailable;

extern int isOK;

/* Timeout is in milliseconds */
extern int32_t TIMEOUT;

/* checks, if the entered string is present in the given buffer ?
 * Returns 1 on Success
 * Returns 0 on Failure
 * */
uint8_t checkString(char* str, char* buffertolookinto)
{
    int stringlength = strlen(str);
    int bufferlength = strlen(buffertolookinto);
    int so_far       = 0;
    int indx         = 0;
repeat:
    while (str[so_far] != buffertolookinto[indx])
    {
        indx++;
        if (indx > bufferlength)
            return 0;
    }

    if (str[so_far] == buffertolookinto[indx])
    {
        while (str[so_far] == buffertolookinto[indx])
        {
            so_far++;
            indx++;
        }
    }

    if (so_far != stringlength)
    {
        so_far = 0;
        if (indx >= bufferlength)
            return 0;
        goto repeat;
    }

    if (so_far == stringlength)
        return 1;
    else
        return 0;
}

/* waits for a particular string in the Rx Buffer
 * By Default it is set to wait for "OK", you can change the string in the
 * HAL_UARTEx_RxEventCallback function This function will wait in the blocking
 * mode, so to avoid the halt, we will also include the timeout The timeout is
 * in milliseconds returns 1 on success returns 0 on failure
 * */
uint8_t isConfirmed(int32_t Timeout)
{
    TIMEOUT = Timeout;
    while ((!isOK) && (TIMEOUT))
        ;
    isOK = 0;
    if (TIMEOUT <= 0)
        return 0;
    return 1;
}

/* Waits for a particular string to arrive in the incoming buffer... It also
 * increments the tail returns 1, if the string is detected return 0, in case of
 * the timeout
 */
int waitFor(char* string, uint32_t Timeout)
{
    int so_far = 0;
    int len    = strlen(string);

    TIMEOUT = Timeout;

    while ((Tail_UART1 == Head_UART1) && TIMEOUT)
        ;  // let's wait for the data to show up
    isDataAvailable = 0;

again:

    /* If the data doesn't show up, then return 0 */
    if (TIMEOUT <= 0)
        return 0;

    /* if the incoming data does not match with the string, we will simply
     * increment the index And wait for the string to arrive in the incoming
     * data
     * */
    while (MainBuf_UART1[Tail_UART1] !=
           string[so_far])  // peek in the rx_buffer to see if we get the string
    {
        if (TIMEOUT <= 0)
            return 0;

        if (Tail_UART1 == Head_UART1)
            goto again;
        Tail_UART1++;

        if (Tail_UART1 == MAINBUF_UART1_SIZE)
            Tail_UART1 = 0;
    }

    /* If the incoming data does match with the string, we will return 1 to
     * indicate this */
    while (MainBuf_UART1[Tail_UART1] ==
           string[so_far])  // if we got the first letter of the string
    {
        if (TIMEOUT <= 0)
            return 0;
        so_far++;

        if (Tail_UART1 == Head_UART1)
            goto again;
        Tail_UART1++;
        if (Tail_UART1 == MAINBUF_UART1_SIZE)
            Tail_UART1 = 0;
        if (so_far == len)
            return 1;
    }

    //	if (so_far != len)
    //	{
    //		so_far = 0;
    //		goto again;
    //	}

    // HAL_Delay (100);

    if ((so_far != len) && isDataAvailable)
    {
        isDataAvailable = 0;
        //		so_far = 0;
        goto again;
    }
    else
    {
        so_far = 0;
        goto again;
    }

    return 0;
}

/* copies the data from the incoming buffer into our buffer
 * Must be used if you are sure that the data is being received
 * it will copy irrespective of, if the end string is there or not
 * if the end string gets copied, it returns 1 or else 0
 *
 */
int copyUpto(char* string, char* buffertocopyinto, uint32_t Timeout)
{
    int so_far = 0;
    int len    = strlen(string);
    int indx   = 0;

    TIMEOUT = Timeout;
    while ((Tail_UART1 == Head_UART1) && TIMEOUT)
        ;
    isDataAvailable = 0;
again:

    if (TIMEOUT <= 0)
        return 0;

    /* Keep copying data until the string is found in the incoming data */
    while (MainBuf_UART1[Tail_UART1] != string[so_far])
    {
        buffertocopyinto[indx] = MainBuf_UART1[Tail_UART1];

        if (Tail_UART1 == Head_UART1)
            goto again;
        Tail_UART1++;
        indx++;
        if (Tail_UART1 == MAINBUF_UART1_SIZE)
            Tail_UART1 = 0;
    }

    /* If the string is found, copy it and return 1
     * or else goto again: and keep copying
     */
    while (MainBuf_UART1[Tail_UART1] == string[so_far])
    {
        so_far++;
        buffertocopyinto[indx++] = MainBuf_UART1[Tail_UART1++];
        if (Tail_UART1 == MAINBUF_UART1_SIZE)
            Tail_UART1 = 0;
        if (so_far == len)
            return 1;
    }

    // HAL_Delay (100);

    if ((so_far != len) && isDataAvailable)
    {
        isDataAvailable = 0;
        //		so_far = 0;
        goto again;
    }
    else
    {
        so_far = 0;
        goto again;
    }
    return 0;
}

/* Copies the entered number of characters, after the entered string (from the
 * incoming buffer), into the buffer returns 1, if the string is copied returns
 * 0, in case of the timeout
 */
int getAfter(char* string, uint8_t numberofchars, char* buffertocopyinto,
             uint32_t Timeout)
{
    if ((waitFor(string, Timeout)) != 1)
        return 0;
    //	TIMEOUT = Timeout/3;
    //	while (TIMEOUT > 0);
    // HAL_Delay (100);
    for (int indx = 0; indx < numberofchars; indx++)
    {
        if (Tail_UART1 == MAINBUF_UART1_SIZE)
            Tail_UART1 = 0;
        buffertocopyinto[indx] =
            MainBuf_UART1[Tail_UART1++];  // save the data into the buffer...
                                          // increments the tail
    }
    return 1;
}

/* Copies the data between the 2 strings from the source buffer into the
 * destination buffer It does not copy the start string or the end string..
 */

void getDataFromBuffer(char* startString, char* endString,
                       char* buffertocopyfrom, char* buffertocopyinto)
{
    int startStringLength = strlen(startString);
    int endStringLength   = strlen(endString);
    int so_far            = 0;
    int indx              = 0;
    int startposition     = 0;
    int endposition       = 0;

repeat1:

    while (startString[so_far] != buffertocopyfrom[indx])
        indx++;
    if (startString[so_far] == buffertocopyfrom[indx])
    {
        while (startString[so_far] == buffertocopyfrom[indx])
        {
            so_far++;
            indx++;
        }
    }

    if (so_far == startStringLength)
        startposition = indx;
    else
    {
        so_far = 0;
        goto repeat1;
    }

    so_far = 0;

repeat2:

    while (endString[so_far] != buffertocopyfrom[indx])
        indx++;
    if (endString[so_far] == buffertocopyfrom[indx])
    {
        while (endString[so_far] == buffertocopyfrom[indx])
        {
            so_far++;
            indx++;
        }
    }

    if (so_far == endStringLength)
        endposition = indx - endStringLength;
    else
    {
        so_far = 0;
        goto repeat2;
    }

    so_far = 0;
    indx   = 0;

    for (int i = startposition; i < endposition; i++)
    {
        buffertocopyinto[indx] = buffertocopyfrom[i];
        indx++;
    }
}
