
// MIT MODE

// int float_to_uint(float x, float x_min, float x_max, unsigned int bits)
//{
//     // Calculate the span of the range
//     float span = x_max - x_min;
//
//     // Ensure that x is within the specified range
//     if (x < x_min)
//         x = x_min;
//     else if (x > x_max)
//         x = x_max;
//
//     // Map the float value x to an unsigned integer within the specified
//     range and precision return (int)((x - x_min) * ((float)(1 << bits) /
//     span));
//     // Exemple:
//     // mapped_value = (int)((7.5 - 0.0) * ((float)(1 << 12) / 10.0))
//     // mapped_value = (int)(7.5 * (4096.0 / 10.0))
//     // mapped_value = (int)(7.5 * 409.6)
//     // mapped_value = (int)(3072.0)
//     // mapped_value = 3072
// }

// void comm_can_transmit_eid(uint32_t id, uint8_t* data, uint8_t len) {
////    uint8_t i = 0;
//
//    if (len > 8) {
//        len = 8;
//    }
//
//    TxHeader.DLC = len;  // data length
//    TxHeader.IDE = CAN_ID_STD;
//    TxHeader.RTR = CAN_RTR_DATA;
//    TxHeader.StdId = 0x1;
//    TxHeader.ExtId = 0;  // Use the provided id parameter as the Extended ID
//
//    if (HAL_CAN_AddTxMessage(&hcan1, &TxHeader, data, &TxMailbox) != HAL_OK) {
//        Error_Handler();
//    }
//}

// void EnterMotorMode(uint8_t controller_id) {
//     uint8_t data[8];
//
//     data[0] = 0xFF;
//     data[1] = 0xFF;
//     data[2] = 0xFF;
//     data[3] = 0xFF;
//     data[4] = 0xFF;
//     data[5] = 0xFF;
//     data[6] = 0xFF;
//     data[7] = 0xFC;
//
//     // Pass the controller_id as the Extended ID to comm_can_transmit_eid
//     comm_can_transmit_eid(controller_id, data, 8);
// }
//
//
// void ExitMotorMode(uint8_t controller_id){
//
//     uint8_t data[8];
//
//	data[0] = 0xFF;
//	data[1] = 0xFF;
//	data[2] = 0xFF;
//	data[3] = 0xFF;
//	data[4] = 0xFF;
//	data[5] = 0xFF;
//	data[6] = 0xFF;
//	data[7] = 0xFD;
//	comm_can_transmit_eid(controller_id, data, 8);
//
//
// }
//
// void Zero(uint8_t controller_id){
//	uint8_t data[8];
//
//	data[0] = 0xFF;
//	data[1] = 0xFF;
//	data[2] = 0xFF;
//	data[3] = 0xFF;
//	data[4] = 0xFF;
//	data[5] = 0xFF;
//	data[6] = 0xFF;
//	data[7] = 0xFE;
//	comm_can_transmit_eid(controller_id, data, 8);
//
//
// }
//
//
// void pack_MIT_cmd(uint8_t controller_id, float p_des, float v_des, float kp,
// float kd, float t_ff){ /// limit data to be within bounds /// 	float P_MIN
//=-12.5f; 	float P_MAX =12.5f; 	float V_MIN =-50.0f; 	float V_MAX =50.0f;
// float T_MIN =-65.0f; 	float T_MAX =65.0f; 	float Kp_MIN =0; 	float
// Kp_MAX
// =500; 	float Kd_MIN =0; 	float Kd_MAX =5;
//     uint8_t data[8];
//
//	p_des = fminf(fmaxf(P_MIN, p_des), P_MAX);
//	v_des = fminf(fmaxf(V_MIN, v_des), V_MAX);
//	kp = fminf(fmaxf(Kp_MIN, kp), Kp_MAX);
//	kd = fminf(fmaxf(Kd_MIN, kd), Kd_MAX);
//	t_ff = fminf(fmaxf(T_MIN, t_ff), T_MAX);
//
//	/// convert floats to unsigned ints ///
//	unsigned int p_int = float_to_uint(p_des, P_MIN, P_MAX, 16);
//	unsigned int v_int = float_to_uint(v_des, V_MIN, V_MAX, 12);
//	unsigned int kp_int = float_to_uint(kp, Kp_MIN, Kp_MAX, 12);
//	unsigned int kd_int = float_to_uint(kd, Kd_MIN, Kd_MAX, 12);
//	unsigned int t_int = float_to_uint(t_ff, T_MIN, T_MAX, 12);
//
//	/// pack ints into the can buffer ///
//	data[0] = p_int >> 8; // post 8 bit high
//	data[1] = p_int & 0xFF;// post 8 bit low
//	data[2] = v_int >> 4;
//	data[3] = ((v_int & 0xF) << 4) | (kp_int >> 8); // Speed 4 bit lower KP 4bit
// higher 	data[4] = kp_int & 0xFF; // KP 8 bit lower 	data[5] = kd_int >> 4;
// // Kd 8 bit higher 	data[6] = ((kd_int & 0xF) << 4) | (kp_int >> 8); // KP 4
// bit lower torque 4 bit higher 	data[7] = t_int & 0xFF; // torque 4 bit
// lower
//
//	comm_can_transmit_eid(controller_id, data, 8);
//
// }

// void unpack_reply(){
//
//	uint8_t len = 0;
//	uint8_t data[8];
//
//	HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &RxHeader, RxData);
//
//
//
// }