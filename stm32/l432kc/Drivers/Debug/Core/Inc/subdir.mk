################################################################################
# Automatically-generated file. Do not edit!
# Toolchain: GNU Tools for STM32 (10.3-2021.10)
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../Core/Inc/cmsis_os2.c \
../Core/Inc/heap_4.c \
../Core/Inc/port.c 

OBJS += \
./Core/Inc/cmsis_os2.o \
./Core/Inc/heap_4.o \
./Core/Inc/port.o 

C_DEPS += \
./Core/Inc/cmsis_os2.d \
./Core/Inc/heap_4.d \
./Core/Inc/port.d 


# Each subdirectory must supply rules for building sources it contributes
Core/Inc/%.o Core/Inc/%.su Core/Inc/%.cyclo: ../Core/Inc/%.c Core/Inc/subdir.mk
	arm-none-eabi-gcc "$<" -mcpu=cortex-m4 -std=gnu11 -g3 -DDEBUG -DUSE_HAL_DRIVER -DSTM32L432xx -c -I../Core/Inc -I../Drivers/STM32L4xx_HAL_Driver/Inc -I../Drivers/STM32L4xx_HAL_Driver/Inc/Legacy -I../Drivers/CMSIS/Device/ST/STM32L4xx/Include -I../Drivers/CMSIS/Include -I../Manager/Inc -O0 -ffunction-sections -fdata-sections -Wall -fstack-usage -fcyclomatic-complexity -MMD -MP -MF"$(@:%.o=%.d)" -MT"$@" --specs=nano.specs -mfpu=fpv4-sp-d16 -mfloat-abi=hard -mthumb -o "$@"

clean: clean-Core-2f-Inc

clean-Core-2f-Inc:
	-$(RM) ./Core/Inc/cmsis_os2.cyclo ./Core/Inc/cmsis_os2.d ./Core/Inc/cmsis_os2.o ./Core/Inc/cmsis_os2.su ./Core/Inc/heap_4.cyclo ./Core/Inc/heap_4.d ./Core/Inc/heap_4.o ./Core/Inc/heap_4.su ./Core/Inc/port.cyclo ./Core/Inc/port.d ./Core/Inc/port.o ./Core/Inc/port.su

.PHONY: clean-Core-2f-Inc

