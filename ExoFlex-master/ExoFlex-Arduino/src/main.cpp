/*------------------------------ Librairies ---------------------------------*/
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>
#include <SoftTimer.h>
#include <Servo.h>
#include <string.h>
/*------------------------------ Global Constantes ---------------------------------*/
using namespace std;

#define BAUD 115200        // Frequence de transmission serielle
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

#define dorsiflex_channel_A 26
#define dorsiflex_channel_B 27
#define eversion_channel_A 24
#define eversion_channel_B 25

Servo dorsiflex_motor;               // PIN 22
Servo eversion_motor;                // PIN 23
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

/*------------------------- Function Prototypes -------------------------*/
void timerCallback();
void sendMsg();
void readMsg();
void serialEvent();
void digitalWrite(uint8_t pin, uint8_t val);

void motorMove(Servo motor, int channel_A, int channel_B, bool motorState, bool motorLastState, int motorCurrentPosition, int motorTargetPosition);

/*---------------------------Setup------------------------*/

void setup()
{
    Serial.begin(BAUD); // Initialisation of serial communication

    // Send message timer
    timerSendMsg_.setDelay(UPDATE_PERIODE);
    timerSendMsg_.setCallback(timerCallback);
    timerSendMsg_.enable();

    // Servo init
    dorsiflex_motor.attach(23); // dorsiflexion motor attached to PIN 22
    eversion_motor.attach(22);  // eversion motor attached to PIN 23
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
        readMsg();
    }
    if (shouldSend_)
    {
        sendMsg();
    }

    //---------------------- SWITCH CASE -------------------------------
    switch (command)
    {
    case INITIALIZE: // Sets all servomotors to initial angles

        // // Untight the strap
        // stepper_tight.moveTo(0);

        // while (stepper_tight.currentPosition() != 0)
        // {
        //     stepper_tight.run(); // Move or step the motor implementing accelerations and decelerations to achieve the target position. Non-blocking function
        // }

        // if( stepper_tight.currentPosition() == 0){
        //     command = WAIT;
        // }

        delay(5000);

        motorMove(dorsiflex_motor, dorsiflex_channel_A, dorsiflex_channel_B, dorsiflexState, dorsiflexLastState, dorsiflexMotorCurrentPos, 90);

        break;

    // case WAIT: // Wait for user to start the exercice
    }

    timerSendMsg_.update();
}

/*------------------------------ Function definitions ---------------------------------*/

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

void motorMove(Servo motor, int channel_A, int channel_B, bool motorState, bool motorLastState, int motorCurrentPosition, int motorTargetPosition)
{

    motor.write(motorTargetPosition); // tell motors to go to position in variable 'motor_pos'

    // Encoder Update
    motorState = digitalRead(channel_A); // Reads the "current" state of the channel_A
    // If the previous and the current state of the channel_A are different, that means a Pulse has occured
    if (motorState != motorLastState)
    {
        // If the outputB state is different to the outputA state, that means the encoder is rotating clockwise
        if (digitalRead(channel_B) != motorState)
        {
            motorCurrentPosition++;
        }
        else
        {
            motorCurrentPosition--;
        }
    }
    Serial.println(motorCurrentPosition);
    motorLastState = motorState; // Updates the previous state of the channel_A with the current state
}

void test()
{

    // Motor tests

    for (dorsiflexMotorCurrentPos = 0; dorsiflexMotorCurrentPos <= 180; dorsiflexMotorCurrentPos += 1)
    { // goes from 0 degrees to 180 degrees
        // in steps of 1 degree
        dorsiflex_motor.write(dorsiflexMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
        delay(20);                                       // waits 15 ms for the servo to reach the position
    }
    for (dorsiflexMotorCurrentPos = 180; dorsiflexMotorCurrentPos >= 0; dorsiflexMotorCurrentPos -= 1)
    {                                                    // goes from 180 degrees to 0 degrees
        dorsiflex_motor.write(dorsiflexMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
        delay(20);                                       // waits 15 ms for the servo to reach the position
    }
    for (eversionMotorCurrentPos = 0; eversionMotorCurrentPos <= 180; eversionMotorCurrentPos += 1)
    { // goes from 0 degrees to 180 degrees
        // in steps of 1 degree
        eversion_motor.write(eversionMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
        delay(20);                                     // waits 15 ms for the servo to reach the position
    }
    for (eversionMotorCurrentPos = 180; eversionMotorCurrentPos >= 0; eversionMotorCurrentPos -= 1)
    {                                                  // goes from 180 degrees to 0 degrees
        eversion_motor.write(eversionMotorCurrentPos); // tell motors to go to position in variable 'motor_pos'
        delay(20);                                     // waits 15 ms for the servo to reach the position
    }

    // Stepper tests

    stepper_tight.moveTo(800);     // Set desired move: 800 steps (in quater-step resolution that's one rotation)
    stepper_tight.runToPosition(); // Moves the motor to target position w/ acceleration/ deceleration and it blocks until is in position

    // Move back to position 0, using run() which is non-blocking - both motors will move at the same time
    stepper_tight.moveTo(0);

    while (stepper_tight.currentPosition() != 0)
    {
        stepper_tight.run(); // Move or step the motor implementing accelerations and decelerations to achieve the target position. Non-blocking function
    }
}
