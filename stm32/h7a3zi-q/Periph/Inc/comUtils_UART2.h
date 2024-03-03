
#ifndef COMUTILS_UART2_H
#define COMUTILS_UART2_H

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdint.h>

    /* Search for a word in a wordlist inside the buffer and deletes unfound
     * words returns the closest word found on success returns NULL if no word
     * found
     */

    char* searchWord(char* buffertocopyfrom);

#ifdef __cplusplus
}
#endif

#endif /* CONMUTILS_UART2_H */
