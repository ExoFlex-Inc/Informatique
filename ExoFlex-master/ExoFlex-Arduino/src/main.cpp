/*****************************************************
 * DIP Switches as per the wized:
 * - Battery Pack -> Pin 3 ON
 * - Arduino Mega
 * - Simplified Serial Mode -> Pin 6 ON, Pin
 * - 9600 baudrate
 *
 * Pin 1 - ON
 * Pin 2 - OFF
 * Pin 3 - ON
 * Pin 4 - ON
 * Pin 5 - OFF
 * Pin 6 - ON
 ****************************************************/

/*------------------------------ Librairies ---------------------------------*/
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>
#include <SoftTimer.h>
#include <Servo.h>
#include <string.h>
/*------------------------------ Global Constantes ---------------------------------*/
using namespace std;

#define BAUD 9600          // Frequence de transmission serielle
#define SBT_BAUDRATE 9600  // Set to 9600 through Sabertooth dip switches
#define UPDATE_PERIODE 100 // Periode (ms) d'envoie d'etat general
#define INITIALIZE 0
#define WAIT 1
#define DORSIFLEXION_UP 2
#define DORSIFLEXION_DOWN 3
#define EVERSION_UP 4
#define EVERSION_DOWN 5
#define TIGHTENING_ON 6
#define TIGHTENING_OFF 7
#define TEST 8

#define eversion_enable 7
#define dorsiflex_enable 8

#define eversion_channel_A 24
#define eversion_channel_B 25
#define dorsiflex_channel_A 26
#define dorsiflex_channel_B 27

// simplifierd serial limits for each motor
#define SBT_EVERSION_FULL_FORWARD 127
#define SBT_EVERSION_FULL_REVERSE 1
#define SBT_EVERSION_STOP 64

#define SBT_DORSIFLEX_FULL_FORWARD 255
#define SBT_DORSIFLEX_FULL_REVERSE 128
#define SBT_DORSIFLEX_STOP 192

// shut down both motors
#define SBT_ALL_STOP 0

Servo dorsiflex_motor;               // PIN 8
Servo eversion_motor;                // PIN 7
AccelStepper stepper_tight(1, 2, 5); // STEP PIN 2, STEP DIR 5

/*------------------------------ Global Variable ---------------------------------*/
volatile bool shouldSend_ = false; // Ready to send message to serial flag
volatile bool shouldRead_ = false; // Ready to read message to serial flag

int dorsiflexMotorCurrentPos = 0; // Dorsiflexion/eversion motor position
bool dorsiflexLastState;
bool dorsiflexState;

int eversionMotorCurrentPos = 0; // Eversion motor position
bool eversionLastState;
bool eversionState;

int period = 300;           // Time to execute the movement
unsigned long time_now = 0; //

int command = INITIALIZE;

SoftTimer timerSendMsg_; // Send message timer

/*------------------------- Functions -------------------------*/

void serialEvent() { shouldRead_ = true; }

void timerCallback() { shouldSend_ = true; }

void sendMsg()
{

    /* Envoit du message Json sur le port seriel */
    StaticJsonDocument<500> doc;

    // Elements du message
    doc["time"] = (millis() / 1000.0);
    doc["Case"] = command;

    // Serialisation
    serializeJson(doc, Serial);

    // Envoit
    Serial.print("*");
    shouldSend_ = false;
}

void readMsg()
{

    // Lecture du message Json
    StaticJsonDocument<500> doc;
    JsonVariant parse_msg;

    // Lecture sur le port Seriel
    DeserializationError error = deserializeJson(doc, Serial);
    shouldRead_ = false;

    // Si erreur dans le message
    if (error)
    {
        Serial.print("deserialize() failed:");
        Serial.println(error.c_str());
        return;
    }

    command = doc["Case"];

    // if (!parse_msg.isNull())
    // {
    //     operation_mode = doc["MODE"].as<int>();
    // }
}

void encoderUpdate(uint8_t channel_A, uint8_t channel_B, bool motorState, bool motorLastState, int motorCurrentPosition, int motorTargetPosition)
{

    // // Encoder Update
    // motorState = digitalRead(channel_A); // Reads the "current" state of the channel_A
    // // If the previous and the current state of the channel_A are different, that means a Pulse has occured
    // if (motorState != motorLastState)
    // {
    //     // If the outputB state is different to the outputA state, that means the encoder is rotating clockwise
    //     if (digitalRead(channel_B) != motorState)
    //     {
    //         motorCurrentPosition++;
    //     }
    //     else
    //     {
    //         motorCurrentPosition--;
    //     }
    // }
    // Serial.println(digitalRead(channel_A));
    // Serial.println(digitalRead(channel_B));
    // Serial.println("--------------");
    // Serial.println(dorsiflexMotorCurrentPos);
    // Serial.println("--------------");
    // motorLastState = motorState; // Updates the previous state of the channel_A with the current state
}

void dorsiflexFastForward()
{
    Serial1.write(SBT_DORSIFLEX_FULL_FORWARD);
}
void dorsiflexFastReverse()
{
    Serial1.write(SBT_DORSIFLEX_FULL_REVERSE);
}
void eversionFastForward()
{
    Serial1.write(SBT_EVERSION_FULL_FORWARD);
}
void eversionFastReverse()
{
    Serial1.write(SBT_EVERSION_FULL_REVERSE);
}
void stopMotors()
{
    Serial1.write(SBT_EVERSION_STOP);
}

/*****************************************************
 * setEngineSpeed
 *
 * Inputs - cSpeed_Motor1 - Input a percentage of full
 *                          speed, from -100 to +100
 *
 *****************************************************/
void setEngineSpeed(signed char cNewMotorSpeed)
{
    unsigned char cSpeedVal_Motor1 = 0;

    unsigned char cSpeedVal_Motor2 = 0;

    // Check for full stop command
    if (cNewMotorSpeed == 0)
    {
        // Send full stop command for both motors
        Serial1.write(byte(0));

        return;
    }

    // Calculate the speed value for motor 1
    if (cNewMotorSpeed >= 100)
    {

        cSpeedVal_Motor1 = SBT_EVERSION_FULL_FORWARD;

        cSpeedVal_Motor2 = SBT_DORSIFLEX_FULL_FORWARD;
    }
    else if (cNewMotorSpeed <= -100)
    {
        cSpeedVal_Motor1 = SBT_EVERSION_FULL_REVERSE;

        cSpeedVal_Motor2 = SBT_DORSIFLEX_FULL_REVERSE;
    }
    else
    {
        // Calc motor 1 speed (Final value ranges from 1 to 127)
        cSpeedVal_Motor1 = map(cNewMotorSpeed,
                               -100,
                               100,
                               SBT_DORSIFLEX_FULL_REVERSE,
                               SBT_DORSIFLEX_FULL_FORWARD);

        // Calc motor 2 speed (Final value ranges from 128 to 255)
        cSpeedVal_Motor2 = map(cNewMotorSpeed,
                               -100,
                               100,
                               SBT_EVERSION_FULL_REVERSE,
                               SBT_EVERSION_FULL_FORWARD);
    }

    // Fire the values off to the Sabertooth motor controller
    Serial1.write(byte(cSpeedVal_Motor1));

    Serial1.write(byte(cSpeedVal_Motor2));
}

void test()
{

    // Motor tests

    // for (dorsiflexMotorCurrentPos = 0; dorsiflexMotorCurrentPos <= 180; dorsiflexMotorCurrentPos += 1)
    // { // goes from 0 degrees to 180 degrees
    //     // in steps of 1 degree
    //     dorsiflex_motor.write(dorsiflexMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
    //     delay(20);                                       // waits 15 ms for the servo to reach the position
    // }
    // for (dorsiflexMotorCurrentPos = 180; dorsiflexMotorCurrentPos >= 0; dorsiflexMotorCurrentPos -= 1)
    // {                                                    // goes from 180 degrees to 0 degrees
    //     dorsiflex_motor.write(dorsiflexMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
    //     delay(20);                                       // waits 15 ms for the servo to reach the position
    // }
    // Serial.println(dorsiflexMotorCurrentPos);
    // for (eversionMotorCurrentPos = 0; eversionMotorCurrentPos <= 180; eversionMotorCurrentPos += 1)
    // { // goes from 0 degrees to 180 degrees
    //     // in steps of 1 degree
    //     eversion_motor.write(eversionMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
    //     delay(20);                                     // waits 15 ms for the servo to reach the position
    // }
    // for (eversionMotorCurrentPos = 180; eversionMotorCurrentPos >= 0; eversionMotorCurrentPos -= 1)
    // {                                                  // goes from 180 degrees to 0 degrees
    //     eversion_motor.write(eversionMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
    //     delay(20);                                     // waits 15 ms for the servo to reach the position
    // }

    // // Stepper tests

    // stepper_tight.moveTo(800);     // Set desired move: 800 steps (in quater-step resolution that's one rotation)
    // stepper_tight.runToPosition(); // Moves the motor to target position w/ acceleration/ deceleration and it blocks until is in position

    // // Move back to position 0, using run() which is non-blocking - both motors will move at the same time
    // stepper_tight.moveTo(0);

    // while (stepper_tight.currentPosition() != 0)
    // {
    //     stepper_tight.run(); // Move or step the motor implementing accelerations and decelerations to achieve the target position. Non-blocking function
    // }
}

/*---------------------------Setup------------------------*/

void setup()
{
    Serial.begin(BAUD); // Initialisation of serial communication
    Serial1.begin(SBT_BAUDRATE);

    delay(2000);

    // Send full stop command
    // setEngineSpeed(SBT_ALL_STOP);

    // Send message timer
    timerSendMsg_.setDelay(UPDATE_PERIODE);
    timerSendMsg_.setCallback(timerCallback);
    timerSendMsg_.enable();

    // Servo init
    dorsiflex_motor.attach(dorsiflex_enable, 1000, 2000); // dorsiflexion motor attached to PIN 23
    eversion_motor.attach(eversion_enable, 1000, 2000);   // eversion motor attached to PIN 22

    // pinMode(dorsiflex_enable, OUTPUT);
    pinMode(dorsiflex_channel_A, INPUT);
    pinMode(dorsiflex_channel_B, INPUT);
    pinMode(eversion_channel_A, INPUT);
    pinMode(eversion_channel_B, INPUT);

    dorsiflexLastState = digitalRead(dorsiflex_channel_A);
    eversionLastState = digitalRead(eversion_channel_A);

    // Stepper init
    stepper_tight.setMaxSpeed(1000);     // Set maximum speed value for the stepper
    stepper_tight.setAcceleration(500);  // Set acceleration value for the stepper
    stepper_tight.setCurrentPosition(0); // Set the current position to 0 steps
    stepper_tight.disableOutputs();
}

/*------------------------------ Main loop ---------------------------------*/
void loop()
{
    if (shouldRead_)
    {
        // readMsg();
    }
    if (shouldSend_)
    {
        // sendMsg();
    }

    //---------------------- SWITCH CASE -------------------------------
    switch (command)
    {
    case INITIALIZE: // Sets all servomotors to initial angles
        break;
    }

    //---------------------- TESTS -------------------------------
    // Full stop
    // setEngineSpeed(0);
    // Serial.println("STOP");
    // delay(5000);

    // // Half reverse
    // setEngineSpeed(-50);
    // Serial.println("HALF1");
    // delay(5000);

    // // Full reverse
    // setEngineSpeed(-100);
    // Serial.println("FULL1");
    // delay(5000);

    // // Full stop
    // setEngineSpeed(0);
    // Serial.println("STOP");
    // delay(5000);

    // // Half forward
    // setEngineSpeed(50);
    // Serial.println("HALF2");
    // delay(5000);

    // // Full forward
    // setEngineSpeed(100);
    // Serial.println("FULL2");
    // delay(5000);

    int power;

    // Ramp both servo channels from 0 to 180 (full reverse to full forward),
    // waiting 20 ms (1/50th of a second) per value.
    for (power = 0; power <= 180; power++)
    {
        dorsiflex_motor.write(power);
        eversion_motor.write(power);
        delay(20);
    }

    // Now go back the way we came.
    for (power = 180; power >= 0; power--)
    {
        dorsiflex_motor.write(power);
        eversion_motor.write(power);
        delay(20);
    }

    timerSendMsg_.update();
}
