// test_CalcManager.c:
#include "CalcManager.h"
#include "unity.h"

void setUp()
{
}
void tearDown()
{
}

void test_add()
{
    TEST_ASSERT_EQUAL(2, add(1, 1));
}

void test_mul()
{
    TEST_ASSERT_EQUAL(6, mul(2, 3));
}