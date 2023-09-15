// test_CalcManager.c:
#include "CalcManager.h"
#include "unity.h"

// Include necessary headers for your implementation and Unity
#include "uartRingBufDMA.h"  // Adjust this to match your actual file
#include "unity.h"

// Mocked MainBuf for testing
char MainBuf[100] = "hellorightleft";

void setUp(void) {
    // Set up any necessary initialization
}

void tearDown(void) {
    // Clean up after each test
}

void test_searchWord(void) {
    char* result = searchWord();

    // Check if the closest word is "left"
    TEST_ASSERT_EQUAL_STRING("left", result);

    // Check if the buffer after memmove is "left" and the rest is zeroed out
    TEST_ASSERT_EQUAL_STRING("left", MainBuf);

}

int main(void) {
    UNITY_BEGIN();

    RUN_TEST(test_searchWord);

    UNITY_END();
    return 0;
}
