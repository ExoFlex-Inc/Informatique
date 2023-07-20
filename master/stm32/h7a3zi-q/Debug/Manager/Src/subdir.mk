################################################################################
# Automatically-generated file. Do not edit!
# Toolchain: GNU Tools for STM32 (10.3-2021.10)
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../Manager/Src/CalcManager.c 

OBJS += \
./Manager/Src/CalcManager.o 

C_DEPS += \
./Manager/Src/CalcManager.d 


# Each subdirectory must supply rules for building sources it contributes
Manager/Src/%.o Manager/Src/%.su Manager/Src/%.cyclo: ../Manager/Src/%.c Manager/Src/subdir.mk
	arm-none-eabi-gcc "$<" -mcpu=cortex-m7 -std=gnu11 -g3 -DDEBUG -DUSE_HAL_DRIVER -DSTM32H7A3xxQ -c -I../Core/Inc -I../Drivers/STM32H7xx_HAL_Driver/Inc -I../Drivers/STM32H7xx_HAL_Driver/Inc/Legacy -I../Drivers/CMSIS/Device/ST/STM32H7xx/Include -I../Drivers/CMSIS/Include -I../Manager/Inc -O0 -ffunction-sections -fdata-sections -Wall -fstack-usage -fcyclomatic-complexity -MMD -MP -MF"$(@:%.o=%.d)" -MT"$@" --specs=nano.specs -mfpu=fpv5-d16 -mfloat-abi=hard -mthumb -o "$@"

clean: clean-Manager-2f-Src

clean-Manager-2f-Src:
	-$(RM) ./Manager/Src/CalcManager.cyclo ./Manager/Src/CalcManager.d ./Manager/Src/CalcManager.o ./Manager/Src/CalcManager.su

.PHONY: clean-Manager-2f-Src

