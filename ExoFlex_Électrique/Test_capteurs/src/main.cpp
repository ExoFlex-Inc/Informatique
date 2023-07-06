#include <Arduino.h>

int rawValueToDegree();

#define PIN_POTENTIO A0

void setup() {
  Serial.begin(9600);
  pinMode(PIN_POTENTIO, INPUT);
}

void loop() { Serial.println(rawValueToDegree()); }

// Fonctions qui change les valeurs brutes du potentiometre en degre
int rawValueToDegree() {
  int rawValue = analogRead(PIN_POTENTIO);
  int degree = map(rawValue, 0, 1023, 0, 255);
  return degree;
}