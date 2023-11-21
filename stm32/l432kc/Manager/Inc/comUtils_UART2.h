
#ifndef COMUTILS_UART2_H
#define COMUTILS_UART2_H

#include <stdint.h>

/* Search for a word in a wordlist inside the buffer and deletes unfound words
 * returns the closest word found on success
 * returns NULL if no word found
 */

char* searchWord(char* buffertocopyfrom);

#endif /* CONMUTILS_UART2_H */
