#include "Periph_Switch.h"

#define PS_GPIO_DORSIFLEXION_UP   GPIOE
#define PS_GPIO_LEG_LEFT          GPIOE
#define PS_GPIO_EXTENSION_DOWN    GPIOE
#define PS_GPIO_EVERSION_RIGHT    GPIOE
#define PS_GPIO_LEG_RIGHT         GPIOF
#define PS_GPIO_EVERSION_LEFT     GPIOF
#define PS_GPIO_EXTENSION_UP      GPIOF
#define PS_GPIO_DORSIFLEXION_DOWN GPIOD

#define PS_PIN_DORSIFLEXION_UP   GPIO_PIN_4  // D57
#define PS_PIN_LEG_LEFT          GPIO_PIN_5  // D58
#define PS_PIN_EXTENSION_DOWN    GPIO_PIN_6  // D59
#define PS_PIN_EVERSION_RIGHT    GPIO_PIN_3  // D60
#define PS_PIN_LEG_RIGHT         GPIO_PIN_8  // D61
#define PS_PIN_EVERSION_LEFT     GPIO_PIN_7  // D62
#define PS_PIN_EXTENSION_UP      GPIO_PIN_9  // D63
#define PS_PIN_DORSIFLEXION_DOWN GPIO_PIN_10  // D64

#define DEBOUNCE_THRESHOLD 5

void PeriphSwitch_Task()
{
    PeriphSwitch_AnySwitch();
    PeriphSwitch_LegLeft();
    PeriphSwitch_LegRight();
}

bool PeriphSwitch_LegLeft()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    if (HAL_GPIO_ReadPin(PS_GPIO_LEG_LEFT, PS_PIN_LEG_LEFT) == GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }

    return lastState;
}

bool PeriphSwitch_LegRight()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    if (HAL_GPIO_ReadPin(PS_GPIO_LEG_RIGHT, PS_PIN_LEG_RIGHT) == GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }

    return lastState;
}

bool PeriphSwitch_ExtensionUp()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    // Read current state of the switch
    if (HAL_GPIO_ReadPin(PS_GPIO_EXTENSION_UP, PS_PIN_EXTENSION_UP) ==
        GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }

    return lastState;
}

bool PeriphSwitch_ExtensionDown()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    if (HAL_GPIO_ReadPin(PS_GPIO_EXTENSION_DOWN, PS_PIN_EXTENSION_DOWN) ==
        GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }

    return lastState;
}

bool PeriphSwitch_DorsiflexionUp()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    if (HAL_GPIO_ReadPin(PS_GPIO_DORSIFLEXION_UP, PS_PIN_DORSIFLEXION_UP) ==
        GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }
    return lastState;
}

bool PeriphSwitch_DorsiflexionDown()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    if (HAL_GPIO_ReadPin(PS_GPIO_DORSIFLEXION_DOWN, PS_PIN_DORSIFLEXION_DOWN) ==
        GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }
    return lastState;
}

bool PeriphSwitch_EversionLeft()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    if (HAL_GPIO_ReadPin(PS_GPIO_EVERSION_LEFT, PS_PIN_EVERSION_LEFT) ==
        GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }
    return lastState;
}

bool PeriphSwitch_EversionRight()
{
    static uint8_t debounceCounter = 0;
    static bool    lastState       = false;
    bool           currentState;

    if (HAL_GPIO_ReadPin(PS_GPIO_EVERSION_RIGHT, PS_PIN_EVERSION_RIGHT) ==
        GPIO_PIN_RESET)
    {
        currentState = true;  // Switch is pressed
    }
    else
    {
        currentState = false;  // Switch is not pressed
    }

    // Debouncing logic
    if (currentState != lastState)
    {
        debounceCounter++;
        if (debounceCounter >= DEBOUNCE_THRESHOLD)
        {
            lastState       = currentState;
            debounceCounter = 0;
        }
    }
    else
    {
        debounceCounter = 0;
    }
    return lastState;
}

bool PeriphSwitch_AnySwitch()
{
    if (PeriphSwitch_ExtensionUp() || PeriphSwitch_ExtensionDown() ||
        PeriphSwitch_DorsiflexionUp() || PeriphSwitch_DorsiflexionDown() ||
        PeriphSwitch_EversionLeft() || PeriphSwitch_EversionRight())
    {
        return true;
    }
    return false;
}
