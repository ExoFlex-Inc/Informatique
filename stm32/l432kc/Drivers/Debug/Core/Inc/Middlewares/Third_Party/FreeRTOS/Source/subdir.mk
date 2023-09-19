################################################################################
# Automatically-generated file. Do not edit!
# Toolchain: GNU Tools for STM32 (10.3-2021.10)
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/croutine.c \
../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/event_groups.c \
../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/list.c \
../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/queue.c \
../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/stream_buffer.c \
../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/tasks.c \
../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/timers.c 

OBJS += \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/croutine.o \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/event_groups.o \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/list.o \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/queue.o \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/stream_buffer.o \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/tasks.o \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/timers.o 

C_DEPS += \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/croutine.d \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/event_groups.d \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/list.d \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/queue.d \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/stream_buffer.d \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/tasks.d \
./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/timers.d 


# Each subdirectory must supply rules for building sources it contributes
Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/%.o Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/%.su Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/%.cyclo: ../Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/%.c Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/subdir.mk
	arm-none-eabi-gcc "$<" -mcpu=cortex-m4 -std=gnu11 -g3 -DDEBUG -DUSE_HAL_DRIVER -DSTM32L432xx -c -I../Core/Inc -I../Drivers/STM32L4xx_HAL_Driver/Inc -I../Drivers/STM32L4xx_HAL_Driver/Inc/Legacy -I../Drivers/CMSIS/Device/ST/STM32L4xx/Include -I../Drivers/CMSIS/Include -I../Manager/Inc -I../Middlewares/Third_Party/FreeRTOS/Source/include -I../Middlewares/Third_Party/FreeRTOS/Source/CMSIS_RTOS_V2 -I../Middlewares/Third_Party/FreeRTOS/Source/portable/GCC/ARM_CM4F -O0 -ffunction-sections -fdata-sections -Wall -fstack-usage -fcyclomatic-complexity -MMD -MP -MF"$(@:%.o=%.d)" -MT"$@" --specs=nano.specs -mfpu=fpv4-sp-d16 -mfloat-abi=hard -mthumb -o "$@"

clean: clean-Core-2f-Inc-2f-Middlewares-2f-Third_Party-2f-FreeRTOS-2f-Source

clean-Core-2f-Inc-2f-Middlewares-2f-Third_Party-2f-FreeRTOS-2f-Source:
	-$(RM) ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/croutine.cyclo ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/croutine.d ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/croutine.o ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/croutine.su ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/event_groups.cyclo ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/event_groups.d ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/event_groups.o ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/event_groups.su ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/list.cyclo ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/list.d ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/list.o ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/list.su ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/queue.cyclo ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/queue.d ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/queue.o ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/queue.su ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/stream_buffer.cyclo ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/stream_buffer.d ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/stream_buffer.o ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/stream_buffer.su ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/tasks.cyclo ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/tasks.d ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/tasks.o ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/tasks.su ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/timers.cyclo ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/timers.d ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/timers.o ./Core/Inc/Middlewares/Third_Party/FreeRTOS/Source/timers.su

.PHONY: clean-Core-2f-Inc-2f-Middlewares-2f-Third_Party-2f-FreeRTOS-2f-Source

