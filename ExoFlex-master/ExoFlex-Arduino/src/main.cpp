/*****************************************************
 * DIP Switches as per the wized:
 * - R/C Mode -> Pin 1 OFF, Pin 2 ON
 * - Battery Pack -> Pin 3 ON
 * - Independant Mode( S1 controls Motor1, S2 controls Motor2) -> Pin 4 OFF
 * - Linear Response -> Pin 5 ON
 * - Microcontroller mode -> Pin 6 OFF
 *
 * Pin 1 - OFF
 * Pin 2 - ON
 * Pin 3 - ON
 * Pin 4 - OFF
 * Pin 5 - ON
 * Pin 6 - OFF
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

#define BAUD 115200        // Frequence de transmission serielle
#define SBT_BAUDRATE 9600  // Set to 9600 through Sabertooth dip switches
#define UPDATE_PERIODE 100 // Periode (ms) d'envoie d'etat general

#define INITIALIZE 0
#define WAIT 1
#define DORSIFLEXION_UP 2
#define DORSIFLEXION_DOWN 3
#define EVERSION_RIGHT 5
#define EVERSION_LEFT 4
#define TIGHTENING 6

#define eversion_enable 6
#define dorsiflex_enable 7

#define eversion_channel_A 24
#define eversion_channel_B 25
#define dorsiflex_channel_A 26
#define dorsiflex_channel_B 27

#define eversion_limit_switch 28
#define dorsiflex_limit_switch 29

#define tightening_step_resolution 200 // Set desired move: 200 steps (in quater-step resolution that's one rotation)

Servo dorsiflex_motor;               // PIN 8
Servo eversion_motor;                // PIN 7
AccelStepper stepper_tight(1, 2, 5); // STEP PIN 2, STEP DIR 5

/*------------------------------ Global Variable ---------------------------------*/
volatile bool shouldSend_ = false; // Ready to send message to serial flag
volatile bool shouldRead_ = false; // Ready to read message to serial flag

int dorsiflexMotorCurrentAngle; // Dorsiflexion motor angle
bool dorsiflexLastState;
bool dorsiflexState;

int eversionMotorCurrentAngle; // Eversion motor angle
bool eversionLastState;
bool eversionState;

int tighteningCurrentAngle; // Tightening motor angle

int period = 2;             // Time to execute the movement
unsigned long time_now = 0; // Time of code now

int command = WAIT;

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
    // doc["DorsiflexAngle"] = dorsiflexMotorCurrentAngle;
    doc["DorsiflexAngle"] = map(dorsiflexMotorCurrentAngle, 1000, 2000, 0, 180);
    doc["EversionAngle"] = map(eversionMotorCurrentAngle, 1000, 2000, 0, 180);
    doc["TighteningAngle"] = map(tighteningCurrentAngle, 0, tightening_step_resolution, 0, 180);

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

    parse_msg = doc["Case"];

    if (!parse_msg.isNull())
    {
        command = doc["Case"];
    }
    parse_msg = doc["TighteningAngle"];

    if (!parse_msg.isNull())
    {
        tighteningCurrentAngle = doc["TighteningAngle"];
        tighteningCurrentAngle = map(tighteningCurrentAngle, 0, 180, 0, tightening_step_resolution);
    }
    parse_msg = doc["DorsiflexAngle"];

    if (!parse_msg.isNull())
    {
        dorsiflexMotorCurrentAngle = map(doc["DorsiflexAngle"], 0, 180, 1000, 2000);
    }
    parse_msg = doc["EversionAngle"];

    if (!parse_msg.isNull())
    {
        eversionMotorCurrentAngle = map(doc["EversionAngle"], 0, 180, 1000, 2000);
    }
}

void motorMove(const char *motor, int power)
{

    // Remap power percent to motor speed values(0 = full reverse, 90 = stop, 180 = full forward)
    if (power >= 100)
    {
        power = 180;
    }
    else if (power <= -100)
    {
        power = 0;
    }
    else
    {
        power = map(power, -100, 100, 0, 180);
    }

    if (motor == "dorsiflex")
    {
        if (power == 90)
        {

            dorsiflex_motor.write(power);
            return;
        }

        // Move motor
        dorsiflex_motor.write(power);

        // Update Encoder
        dorsiflexState = digitalRead(dorsiflex_channel_A); // Reads the "current" state of the channel_A

        // If the previous and the current state of the channel_A are different, that means a Pulse has occured
        if (dorsiflexState != dorsiflexLastState)
        {
            // If the outputB state is different to the outputA state, that means the encoder is rotating clockwise
            if (digitalRead(dorsiflex_channel_B) != dorsiflexState)
            {
                dorsiflexMotorCurrentAngle++;
            }
            else
            {
                dorsiflexMotorCurrentAngle--;
            }
        }

        dorsiflexLastState = dorsiflexState; // Updates the previous state of the channel_A with the current state
    }
    else if (motor == "eversion")
    {
        if (power == 90)
        {
            eversion_motor.write(power);
            return;
        }

        // Move motor
        eversion_motor.write(power);

        // Update Encoder
        eversionState = digitalRead(eversion_channel_A); // Reads the "current" state of the channel_A

        // If the previous and the current state of the channel_A are different, that means a Pulse has occured
        if (eversionState != eversionLastState)
        {
            // If the outputB state is different to the outputA state, that means the encoder is rotating clockwise
            if (digitalRead(eversion_channel_B) != eversionState)
            {
                eversionMotorCurrentAngle++;
            }
            else
            {
                eversionMotorCurrentAngle--;
            }
        }

        eversionLastState = eversionState; // Updates the previous state of the channel_A with the current state
    }
    // Serial.println(power);
    // Serial.println("--------------");
    // Serial.println(digitalRead(dorsiflex_channel_A));
    // Serial.println(digitalRead(dorsiflex_channel_B));
    // Serial.println("--------------");
    // Serial.println(dorsiflexMotorCurrentAngle);
    // Serial.println("--------------");
}

/*---------------------------Setup------------------------*/

void setup()
{
    Serial.begin(BAUD); // Initialisation of serial communication

    // Send message timer
    timerSendMsg_.setDelay(UPDATE_PERIODE);
    timerSendMsg_.setCallback(timerCallback);
    timerSendMsg_.enable();

    // Servo init
    // With all three arguments, we can use 0 to 180 degrees, with 90 being stopped.
    dorsiflex_motor.attach(dorsiflex_enable, 1000, 2000); // dorsiflexion motor attached to PIN 8
    eversion_motor.attach(eversion_enable, 1000, 2000);   // eversion motor attached to PIN 7

    dorsiflex_motor.write(90);
    eversion_motor.write(90);

    pinMode(dorsiflex_channel_A, INPUT);
    pinMode(dorsiflex_channel_B, INPUT);
    pinMode(eversion_channel_A, INPUT);
    pinMode(eversion_channel_B, INPUT);

    pinMode(dorsiflex_limit_switch, INPUT);
    pinMode(eversion_limit_switch, INPUT);

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
    case INITIALIZE:
        break;
    case WAIT:
        motorMove("dorsiflex", 0);
        motorMove("eversion", 0);
        break;

    case DORSIFLEXION_UP: // Sets all servomotors to initial angles
        motorMove("dorsiflex", 100);
        break;

    case DORSIFLEXION_DOWN: // Sets all servomotors to initial angles
        motorMove("dorsiflex", -100);
        break;

    case EVERSION_LEFT: // Sets all servomotors to initial angles
        motorMove("eversion", 50);
        eversionMotorCurrentAngle += 1;
        break;

    case EVERSION_RIGHT: // Sets all servomotors to initial angles
        motorMove("eversion", -50);
        break;
    case TIGHTENING:
        stepper_tight.moveTo(tighteningCurrentAngle);
        stepper_tight.run();
        break;
    }

    timerSendMsg_.update();
}
