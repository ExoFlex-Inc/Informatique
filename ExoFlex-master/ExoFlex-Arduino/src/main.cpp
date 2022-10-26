/*------------------------------ Librairies ---------------------------------*/
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <SoftTimer.h>
#include <Servo.h>
/*------------------------------ Global Constantes ---------------------------------*/
using namespace std;

#define BAUD 115200        // Frequence de transmission serielle
#define UPDATE_PERIODE 100 // Periode (ms) d'envoie d'etat general

Servo dorsiflex_motor; // PIN 10
Servo eversion_motor;  // PIN 11

/*------------------------------ Global Variable ---------------------------------*/
volatile bool shouldSend_ = false; // Ready to send message to serial flag
volatile bool shouldRead_ = false; // Ready to read message to serial flag

int pos = 0; // Dorsiflexion motor position

SoftTimer timerSendMsg_; // Send message timer

/*------------------------- function prototypes -------------------------*/
void timerCallback();
void sendMsg();
void readMsg();
void serialEvent();
void digitalWrite(uint8_t pin, uint8_t val);

/*---------------------------Setup------------------------*/

void setup()
{
    Serial.begin(BAUD); // Initialisation of serial communication

    // Send message timer
    timerSendMsg_.setDelay(UPDATE_PERIODE);
    timerSendMsg_.setCallback(timerCallback);
    timerSendMsg_.enable();

    // Servo init
    dorsiflex_motor.attach(10); // dorsiflexion motor attached to PIN 10
    eversion_motor.attach(11);  // dorsiflexion motor attached to PIN 10
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

    for (pos = 0; pos <= 180; pos += 1)
    { // goes from 0 degrees to 180 degrees
        // in steps of 1 degree
        dorsiflex_motor.write(pos); // tell servo to go to position in variable 'pos'
        eversion_motor.write(pos);  // tell servo to go to position in variable 'pos'
        delay(20);                  // waits 15 ms for the servo to reach the position
    }
    for (pos = 180; pos >= 0; pos -= 1)
    {                               // goes from 180 degrees to 0 degrees
        dorsiflex_motor.write(pos); // tell servo to go to position in variable 'pos'
        eversion_motor.write(pos);  // tell servo to go to position in variable 'pos'
        delay(20);                  // waits 15 ms for the servo to reach the position
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
        Serial.print("deserialize() failed: ");
        Serial.println(error.c_str());
        return;
    }

    // parse_msg = doc["MODE"];

    // if (!parse_msg.isNull())
    // {
    //     operation_mode = doc["MODE"].as<int>();
    // }
    // parse_msg = doc["CASE"];
}
