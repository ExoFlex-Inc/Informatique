/*
 * ESP8266_HAL.h
 *
 *  Created on: Apr 14, 2020
 *      Author: Controllerstech
 */

#ifndef INC_ESP8266_HAL_H_
#define INC_ESP8266_HAL_H_


int ESP_Init (char *SSID, char *PASSWD);

void constructPostCommand(char *command, const char *url, int contentLength, char *apiKey);

void constructPutCommand(char *command, const char *url, int contentLength);

//void constructGetCommand(char *command, const char *url, int txSize, int rxSize, int timeout);

void serverStart(void);

void serverSend(void);

void readJSONFile(const char *filename, char *jsonBuffer, int maxBufferSize);

#endif /* INC_ESP8266_HAL_H_ */
