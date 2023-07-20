// test_CalcManager.c:
#include "unity.h"
#include "CalcManager.h"

void setUp() {}
void tearDown() {}

void test_add() 
{
    TEST_ASSERT_EQUAL(2, add(1,1));
}

void test_mul() 
{
    TEST_ASSERT_EQUAL(6, mul(2,3));
}