################################################################################
# Automatically-generated file. Do not edit!
# Toolchain: GNU Tools for STM32 (10.3-2021.10)
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../Manager/Src/CalcManager.c \
../Manager/Src/json_utils.c 

OBJS += \
./Manager/Src/CalcManager.o \
./Manager/Src/json_utils.o 

C_DEPS += \
./Manager/Src/CalcManager.d \
./Manager/Src/json_utils.d 


# Each subdirectory must supply rules for building sources it contributes
Manager/Src/%.o Manager/Src/%.su Manager/Src/%.cyclo: ../Manager/Src/%.c Manager/Src/subdir.mk
	arm-none-eabi-gcc "$<" -mcpu=cortex-m4 -std=gnu11 -g3 -DDEBUG -DUSE_HAL_DRIVER -DSTM32L432xx -c -I../Core/Inc -I../Drivers/STM32L4xx_HAL_Driver/Inc -I../Drivers/STM32L4xx_HAL_Driver/Inc/Legacy -I../Drivers/CMSIS/Device/ST/STM32L4xx/Include -I../Drivers/CMSIS/Include -I../Manager/Inc -I../Middlewares/Third_Party/FreeRTOS/Source/include -I../Middlewares/Third_Party/FreeRTOS/Source/CMSIS_RTOS_V2 -I../Middlewares/Third_Party/FreeRTOS/Source/portable/GCC/ARM_CM4F -O0 -ffunction-sections -fdata-sections -Wall -fstack-usage -fcyclomatic-complexity -MMD -MP -MF"$(@:%.o=%.d)" -MT"$@" --specs=nano.specs -mfpu=fpv4-sp-d16 -mfloat-abi=hard -mthumb -o "$@"

clean: clean-Manager-2f-Src

clean-Manager-2f-Src:
	-$(RM) ./Manager/Src/CalcManager.cyclo ./Manager/Src/CalcManager.d ./Manager/Src/CalcManager.o ./Manager/Src/CalcManager.su ./Manager/Src/json_utils.cyclo ./Manager/Src/json_utils.d ./Manager/Src/json_utils.o ./Manager/Src/json_utils.su

.PHONY: clean-Manager-2f-Src

