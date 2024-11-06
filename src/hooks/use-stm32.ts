import { useState, useEffect } from "react";
import socketIOClient, { Socket } from "socket.io-client";

// Define the type of events if needed
interface MyEvents {
  stm32Data: stm32DataType;
  serialPortClosed: string;
  sendDataToStm32: string;
}

export type stm32DataType = {
  Mode: string;
  AutoState: string;
  HomingState: string;
  CurrentLegSide: string;
  Repetitions: number;
  ExerciseIdx: number;
  ErrorCode: number;
  Positions: number[];
  Torques: number[];
  Current: number[];
};

const ENDPOINT = "http://localhost:3001"; // Pointing to the server on port 3001

const useStm32 = () => {
  const [stm32Data, setStm32Data] = useState<stm32DataType | null>(null);
  const [retrySerial, setRetrySerial] = useState<boolean>(true);
  const [errorFromStm32, setErrorFromStm32] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket<MyEvents> | null>(null);

  const initializeSerialPort = async () => {
    try {
      console.log("Attempting to initialize STM32 serial port...");
      setRetrySerial(false);

      const responseSerialPort = await fetch(
        "http://localhost:3001/stm32/initialize-serial-port",
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!responseSerialPort.ok) {
        console.error(
          "Failed to initialize serial port: Check STM32 connection",
        );
        const shouldRetry = window.confirm(
          "Failed to initialize serial port. Check STM32 connection. Retry?",
        );
        setRetrySerial(shouldRetry);
      } else {
        setRetrySerial(false);
        setErrorFromStm32(false); // Reset error state after successful initialization
      }
    } catch (error) {
      console.error(
        "An error occurred during serial port initialization:",
        error,
      );
      setRetrySerial(true);
    }
  };

  // Effect to handle serial port initialization and socket connection
  useEffect(() => {
    let newSocket: Socket<MyEvents> | null = null;

    if (retrySerial) {
      initializeSerialPort();
    } else {
      // Create the new Socket.IO connection to the server on port 3001
      newSocket = socketIOClient(ENDPOINT, {
        transports: ["websocket"], // Use WebSocket transport
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }) as Socket<MyEvents>;

      setSocket(newSocket);
    }

    return () => {
      // Clean up socket when component unmounts or on retry
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [retrySerial]);

  // Effect to handle socket event listeners
  useEffect(() => {
    if (socket) {
      const handleStm32Data = (message: stm32DataType) => {
        setStm32Data(message);
      };

      const handleSerialPortClosed = () => {
        setErrorFromStm32(true);
        setRetrySerial(true);
      };

      socket.on("stm32Data", handleStm32Data);
      socket.on("serialPortClosed", handleSerialPortClosed);

      return () => {
        socket.off("stm32Data", handleStm32Data);
        socket.off("serialPortClosed", handleSerialPortClosed);
      };
    }
  }, [socket]);

  return { stm32Data, socket, errorFromStm32 };
};

export default useStm32;