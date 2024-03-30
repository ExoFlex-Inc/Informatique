#include "Periph_Switch.h"

#define PS_GPIO_LEG_LEFT          GPIOE
#define PS_GPIO_LEG_RIGHT         GPIOE
#define PS_GPIO_EXTENSION_UP      GPIOE
#define PS_GPIO_EXTENSION_DOWN    GPIOE
#define PS_GPIO_DORSIFLEXION_UP   GPIOF
#define PS_GPIO_DORSIFLEXION_DOWN GPIOF
#define PS_GPIO_EVERSION_LEFT     GPIOF
#define PS_GPIO_EVERSION_RIGHT    GPIOD

#define PS_PIN_LEG_LEFT          GPIO_PIN_4  // D57
#define PS_PIN_LEG_RIGHT         GPIO_PIN_5  // D58
#define PS_PIN_EXTENSION_UP      GPIO_PIN_6  // D59
#define PS_PIN_EXTENSION_DOWN    GPIO_PIN_3  // D60
#define PS_PIN_DORSIFLEXION_UP   GPIO_PIN_8  // D61
#define PS_PIN_DORSIFLEXION_DOWN GPIO_PIN_7  // D62
#define PS_PIN_EVERSION_LEFT     GPIO_PIN_9  // D63
#define PS_PIN_EVERSION_RIGHT    GPIO_PIN_10  // D64

bool PeriphSwitch_LegLeft()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_LEG_LEFT, PS_PIN_LEG_LEFT) == GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_LegRight()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_LEG_RIGHT, PS_PIN_LEG_RIGHT) == GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_ExtensionUp()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_EXTENSION_UP, PS_PIN_EXTENSION_UP) ==
        GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_ExtensionDown()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_EXTENSION_DOWN, PS_PIN_EXTENSION_DOWN) ==
        GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_DorsiflexionUp()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_DORSIFLEXION_UP, PS_PIN_DORSIFLEXION_UP) ==
        GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_DorsiflexionDown()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_DORSIFLEXION_DOWN, PS_PIN_DORSIFLEXION_DOWN) ==
        GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_EversionLeft()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_EVERSION_LEFT, PS_PIN_EVERSION_LEFT) ==
        GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_EversionRight()
{
    if (HAL_GPIO_ReadPin(PS_GPIO_EVERSION_RIGHT, PS_PIN_EVERSION_RIGHT) ==
        GPIO_PIN_RESET)
    {
        return true;
    }
    return false;
}

bool PeriphSwitch_AnySwitch()
{
    if (PeriphSwitch_LegLeft() || PeriphSwitch_LegRight() ||
        PeriphSwitch_ExtensionUp() || PeriphSwitch_ExtensionDown() ||
        PeriphSwitch_DorsiflexionUp() || PeriphSwitch_DorsiflexionDown() ||
        PeriphSwitch_EversionLeft() || PeriphSwitch_EversionRight())
    {
        return true;
    }
    return false;
}
