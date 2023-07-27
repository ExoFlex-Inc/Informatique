#ifndef JSON_UTILS_H
#define JSON_UTILS_H

#include "main.h"

void send_json_msg(UART_HandleTypeDef *huart, const char *json_message);

//uint8_t receive_json_message(char *json_buffer);
//
//void parse_json_message(const char *json_message);

#endif /* JSON_UTILS_H */
