
#ifndef COMUTILS_H
#define COMUTILS_H

#include <stdint.h>

uint8_t checkString(char* str, char* buffertolookinto);

/* waits for a particular string in the Rx Buffer
 * By Default it is set to wait for "OK", you can change the string in the
 * HAL_UARTEx_RxEventCallback function This function will wait in the blocking
 * mode, so to avoid the halt, we will also include the timeout The timeout is
 * in milliseconds returns 1 on success returns 0 on failure
 * */
uint8_t isConfirmed(int32_t Timeout);

/* Waits for a particular string to arrive in the incoming buffer
 * returns 1, if the string is detected
 */
int waitFor(char* string, uint32_t Timeout);

/* copies the data from the incoming buffer into the provided buffer
 * Must be used if you are sure that the data is being received
 * it will copy irrespective of, if the end string is there or not
 * if the end string gets copied, it returns 1 or else 0
 *
 */
int copyUpto(char* string, char* buffertocopyinto, uint32_t Timeout);

/* Copies the entered number of characters, after the entered string (from the
 * incoming buffer), into the buffer returns 1 on success returns 0 on failure
 */
int getAfter(char* string, uint8_t numberofchars, char* buffertocopyinto,
             uint32_t Timeout);

void getDataFromBuffer(char* startString, char* endString,
                       char* buffertocopyfrom, char* buffertocopyinto);

/* Copies the data from a buffer to another buffer
 */
void getDataFromBuffer(char* startString, char* endString,
                       char* buffertocopyfrom, char* buffertocopyinto);

/* Search for a word in a wordlist inside the buffer and deletes unfound words
 * returns the closest word found on success
 * returns NULL if no word found
 */

char* searchWord(char* buffertocopyfrom);

#endif /* CONMUTILS_H */
