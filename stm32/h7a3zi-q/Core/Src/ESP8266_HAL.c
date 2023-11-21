/*
 * ESP8266_HAL.c
 *
 *  Created on: Apr 14, 2020
 *      Author: Controllerstech
 */


#include <comUtils_UART1.h>
#include "stm32h7xx_hal.h"
#include "uartRingBufDMA.h"
#include "ESP8266_HAL.h"
#include "stdio.h"
#include "string.h"

extern UART_HandleTypeDef huart1;
extern UART_HandleTypeDef huart2;

#define wifi_uart &huart1
#define pc_uart &huart2

#define MAX_URL_LENGTH 150
#define MAX_COMMAND_LENGTH 1000
#define MAX_JSON_LENGTH 50

char apiKey[] = "AIzaSyAQQjCJyLSZBXgBM3D6G5BxqfurfpS_OP4";

char buffer[20];


char *Basic_inclusion = "<!DOCTYPE html> <html>\n<head><meta name=\"viewport\"\
		content=\"width=device-width, initial-scale=1.0, user-scalable=no\">\n\
		<title>LED CONTROL</title>\n<style>html { font-family: Helvetica; \
		display: inline-block; margin: 0px auto; text-align: center;}\n\
		body{margin-top: 50px;} h1 {color: #444444;margin: 50px auto 30px;}\
		h3 {color: #444444;margin-bottom: 50px;}\n.button {display: block;\
		width: 80px;background-color: #1abc9c;border: none;color: white;\
		padding: 13px 30px;text-decoration: none;font-size: 25px;\
		margin: 0px auto 35px;cursor: pointer;border-radius: 4px;}\n\
		.button-on {background-color: #1abc9c;}\n.button-on:active \
		{background-color: #16a085;}\n.button-off {background-color: #34495e;}\n\
		.button-off:active {background-color: #2c3e50;}\np {font-size: 14px;color: #888;margin-bottom: 10px;}\n\
		</style>\n</head>\n<body>\n<h1>ESP8266 LED CONTROL</h1>\n";

char *LED_ON = "<p>LED Status: ON</p><a class=\"button button-off\" href=\"/ledoff\">OFF</a>";
char *LED_OFF = "<p>LED1 Status: OFF</p><a class=\"button button-on\" href=\"/ledon\">ON</a>";
char *Terminate = "</body></html>";


static void uartSend (char *str)
{
	HAL_UART_Transmit(wifi_uart, (uint8_t *) str, strlen (str), 1000);
}

static void debugLog (char *str)
{
	HAL_UART_Transmit(pc_uart, (uint8_t *) str, strlen (str), 1000);
}

/*****************************************************************************************************************************************/

int ESP_Init (char *SSID, char *PASSWD)
{
	char data[80];

	Ringbuf_Init();

//	uartSend("AT+RST\r\n");
	debugLog("STARTING.");
	for (int i=0; i<5; i++)
	{
		debugLog(".");
		HAL_Delay(1000);
	}

	/********* AT **********/
	uartSend("AT\r\n");
	if(isConfirmed(1000) != 1)
	{
		debugLog("failed at AT\n");
		return 0;
	}
	debugLog("\nAT---->OK\n\n");
	HAL_Delay (1000);

	/********* AT+CWMODE=1 **********/
	uartSend("AT+CWMODE=1\r\n");
	if(isConfirmed(2000) != 1)
	{
		debugLog("failed at CWMODE\n");
		return 0;
	}
	debugLog("CW MODE---->1\n\n");
	HAL_Delay (1000);

	/********* AT+CWJAP="SSID","PASSWD" **********/
	debugLog("connecting... to the provided AP\n");

	sprintf (data, "AT+CWJAP=\"%s\",\"%s\"\r\n", SSID, PASSWD);
	uartSend(data);
	if(waitFor("GOT IP", 10000) != 1)
	{
		debugLog("failed to connect to the provided SSID\n");
		return 0;
	}
	sprintf (data, "Connected to,\"%s\"\n\n", SSID);
	debugLog(data);
	debugLog("Waiting for 5 seconds\n");
	/* send dummy */
//	uartSend("AT\r\n");
	HAL_Delay (4000);

	/* sending dummy data */
	Ringbuf_Reset(&huart1);
	HAL_Delay (1000);



	/********* AT+CIFSR **********/
	uartSend("AT+CIFSR\r\n");
	if (waitFor("CIFSR:STAIP,\"", 5000) != 1)
	{
		debugLog("failed to get the STATIC IP Step 1\n");
		return 0;
	}
	if (copyUpto("\"",buffer, 3000) != 1)
	{
		debugLog("failed to get the STATIC IP Step 2\n");
		return 0;
	}
	if(isConfirmed(2000) != 1)
	{
		debugLog("failed to get the STATIC IP Step 3\n");
		return 0;
	}
	int len = strlen (buffer);
	buffer[len-1] = '\0';
	sprintf (data, "IP ADDR: %s\n\n", buffer);
	debugLog(data);
	HAL_Delay (1000);

	uartSend("AT+CIPMUX=1\r\n");
	if (isConfirmed(2000) != 1)
	{
		debugLog("Failed at CIPMUX\n");
		return 0;
	}
	debugLog("CIPMUX---->OK\n\n");

	uartSend("AT+CIPSERVER=1,80\r\n");
	if (isConfirmed(2000) != 1)
	{
		debugLog("Failed at CIPSERVER\n");
		return 0;
	}
	debugLog("CIPSERVER---->OK\n\n");

	debugLog("Now Connected to the IP ADRESS\n\n");

	serverStart();

//	if (isConfirmed(5000) != 1)
//	{
//		debugLog("Failed at POST\n");
//		return 0;
//	}
//
//	debugLog("POST has been made\n\n");


	return 1;

}

void constructPostCommand(char *command, const char *url, int contentLength, char *apiKey) {
    snprintf(command, MAX_COMMAND_LENGTH, "AT+HTTPCPOST=\"%s\",%d,2,\"Content-Type: application/json\"\r\nAuthorization: Bearer %s\r\n", url, contentLength, apiKey);
}


void serverStart(void) {
    char firestorePostCommand[MAX_COMMAND_LENGTH];
    char dataToSend[] = "{\"fields\": {\"angle\": {\"doubleValue\": \"1\"}, \"force\": {\"doubleValue\": \"5\"}}}";
    debugLog(dataToSend);
    // Calculate the content length of the data to be sent
    int contentLength = strlen(dataToSend);

    // Construct the Firestore POST command
    constructPostCommand(firestorePostCommand, "https://firestore.googleapis.com/v1/projects/exoflex-46e22/databases/(default)/documents/patients", contentLength, apiKey);

    // Send data to Firestore
    uartSend(firestorePostCommand);
    HAL_Delay(5000);

    // Send createTableStatement (assuming it's a valid Firestore document)
    uartSend(dataToSend);
}

void serverSend(void) {

    char createTableStatement[] = "{\"id\": 1, \"task\": Hello}";

    uartSend(createTableStatement);

}

void readJSONFile(const char *filename, char *jsonBuffer, int maxBufferSize) {

}

//void parseJSONData(const char *jsonData, DataStructure *parsedData) {
//    // Implement a function to parse 'jsonData' into 'parsedData'
//    // ...
//}
//
//void prepareDataForSupabase(DataStructure *parsedData, char *supabasePayload) {
//    // Implement a function to prepare 'parsedData' as a payload for Supabase
//    // ...
//}
//
//void sendToSupabase(const char *payload) {
//    // Construct the URL for the Supabase API request
//    char url[MAX_URL_LENGTH];
//    constructSupabaseURL(url);
//
//    // Send the HTTP POST request to the Supabase API
//    httpPostRequest(url, payload);
//
//    // Handle the response from Supabase
//    handleSupabaseResponse();
//}

