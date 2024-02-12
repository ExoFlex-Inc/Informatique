################################################################################
# Automatically-generated file. Do not edit!
# Toolchain: GNU Tools for STM32 (11.3.rel1)
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../Periph/Src/CanMotorServo.c \
../Periph/Src/comUtils_UART2.c \
../Periph/Src/uartRingBufDMA.c 

OBJS += \
./Periph/Src/CanMotorServo.o \
./Periph/Src/comUtils_UART2.o \
./Periph/Src/uartRingBufDMA.o 

C_DEPS += \
./Periph/Src/CanMotorServo.d \
./Periph/Src/comUtils_UART2.d \
./Periph/Src/uartRingBufDMA.d 


# Each subdirectory must supply rules for building sources it contributes
Periph/Src/%.o Periph/Src/%.su Periph/Src/%.cyclo: ../Periph/Src/%.c Periph/Src/subdir.mk
	arm-none-eabi-gcc "$<" -mcpu=cortex-m7 -std=gnu11 -DUSE_HAL_DRIVER -DSTM32H7A3xxQ -c -I../Core/Inc -I../Drivers/STM32H7xx_HAL_Driver/Inc -I../Drivers/STM32H7xx_HAL_Driver/Inc/Legacy -I../Drivers/CMSIS/Device/ST/STM32H7xx/Include -I../Drivers/CMSIS/Include -Os -ffunction-sections -fdata-sections -Wall -fstack-usage -fcyclomatic-complexity -MMD -MP -MF"$(@:%.o=%.d)" -MT"$@" --specs=nano.specs -mfpu=fpv5-d16 -mfloat-abi=hard -mthumb -o "$@"

clean: clean-Periph-2f-Src

clean-Periph-2f-Src:
	-$(RM) ./Periph/Src/CanMotorServo.cyclo ./Periph/Src/CanMotorServo.d ./Periph/Src/CanMotorServo.o ./Periph/Src/CanMotorServo.su ./Periph/Src/comUtils_UART2.cyclo ./Periph/Src/comUtils_UART2.d ./Periph/Src/comUtils_UART2.o ./Periph/Src/comUtils_UART2.su ./Periph/Src/uartRingBufDMA.cyclo ./Periph/Src/uartRingBufDMA.d ./Periph/Src/uartRingBufDMA.o ./Periph/Src/uartRingBufDMA.su

.PHONY: clean-Periph-2f-Src

