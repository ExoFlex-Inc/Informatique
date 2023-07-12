#include "../Inc/action.h"
#include "/Library/Ruby/Gems/2.6.0/gems/ceedling-0.31.1/vendor/unity/src/unity.h"




void setUp() {}

void tearDown() {}



void test_add()

{

    UnityAssertEqualNumber((UNITY_INT)((2)), (UNITY_INT)((add(1,1))), (((void*)0)), (UNITY_UINT)(10), UNITY_DISPLAY_STYLE_INT);

}



void test_mul()

{

    UnityAssertEqualNumber((UNITY_INT)((6)), (UNITY_INT)((mul(2,3))), (((void*)0)), (UNITY_UINT)(15), UNITY_DISPLAY_STYLE_INT);

}
