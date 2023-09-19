// Include necessary headers for your implementation and Unity
// #include "mock_uartRingBufDMA.h"
#include <string.h>

#include "comUtils.h"
#include "unity.h"

uint16_t oldPos = 0;
uint16_t newPos = 0;

uint16_t Head, Tail;

int isDataAvailable = 0;

int isOK = 0;

/* Timeout is in milliseconds */
int32_t TIMEOUT = 0;

char MainBuf[100];

void test_searchWord_unfinishedWord(void)
{
    // Mocked MainBuf for testing
    strcpy(MainBuf, "ightrightleft");

    // Call the searchWord function
    char* result = searchWord(MainBuf);

    // Check if the closest word is "left"
    TEST_ASSERT_EQUAL_STRING("right", result);
    // Check if the buffer has "left"
    TEST_ASSERT_EQUAL_STRING("left", MainBuf);
}

void test_searchWord_emptyBuffer(void)
{
    // Mocked MainBuf for testing
    strcpy(MainBuf, "");

    // Call the searchWord function
    char* result = searchWord(MainBuf);

    // Check if the closest word is an NULL pointer
    TEST_ASSERT_EQUAL_STRING(NULL, result);
    // Check if the buffer has empty string
    TEST_ASSERT_EQUAL_STRING("", MainBuf);
}

void test_searchWord_noMatch(void)
{
    // Mocked MainBuf for testing
    strcpy(MainBuf, "abcdefgh");

    // Call the searchWord function
    char* result = searchWord(MainBuf);

    // Check if the closest word has NULL pointer
    TEST_ASSERT_EQUAL_STRING(NULL, result);
    // Check if the buffer has empty string
    TEST_ASSERT_EQUAL_STRING("", MainBuf);
}

void test_searchWord_multipleOccurrences(void)
{
    // Mocked MainBuf for testing
    strcpy(MainBuf, "leftleftright");

    // Call the searchWord function
    char* result = searchWord(MainBuf);

    // Check if the closest word is "left"
    TEST_ASSERT_EQUAL_STRING("left", result);
    // Check if the buffer has "leftright"
    TEST_ASSERT_EQUAL_STRING("leftright", MainBuf);
}
