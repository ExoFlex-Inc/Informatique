#include "MockTimerInterruptHandler.h"
#include "MockTimerModel.h"
#include "MockTimerHardware.h"
#include "src/TimerConductor.h"
#include "src/Types.h"
#include "/Library/Ruby/Gems/2.6.0/gems/ceedling-0.31.1/vendor/unity/src/unity.h"


void setUp(void)

{

}



void tearDown(void)

{

}



void testInitShouldCallHardwareInit(void)

{

  TimerHardware_Init_CMockExpect(18);



  TimerConductor_Init();

}



void testRunShouldGetSystemTimeAndPassOnToModelForEventScheduling(void)

{

  Timer_GetSystemTime_CMockExpectAndReturn(25, 1230);

  TimerModel_UpdateTime_CMockExpect(26, 1230);

  TimerConductor_Run();



  Timer_GetSystemTime_CMockExpectAndReturn(29, 837460);

  TimerModel_UpdateTime_CMockExpect(30, 837460);

  TimerConductor_Run();

}
