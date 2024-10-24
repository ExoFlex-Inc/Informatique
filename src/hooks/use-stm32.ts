import { useState, useEffect } from "react";
import socketIOClient, { Socket } from "socket.io-client";

// Define the type of events if needed
interface MyEvents {
  stm32Data: stm32DataType;
  serialPortClosed: string;
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
}

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

  useEffect(() => {
    if (retrySerial) {
      initializeSerialPort();
    } else {
      // Create the new Socket.IO connection to the server on port 3001
      const newSocket = socketIOClient(ENDPOINT, {
        transports: ["websocket"], // Use WebSocket transport
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }) as Socket<MyEvents>;

      setSocket(newSocket);

      return () => {
        newSocket.disconnect(); // Clean up socket when component unmounts or on retry
      };
    }
  }, [retrySerial]);

  if (socket) {
    // Listen for stm32Data event and update state
    socket.on("stm32Data", (message) => {
      // console.log("Received STM32 data:", message); // For debugging
      setStm32Data(message);
    });

    // Handle serial port closed event
    socket.on("serialPortClosed", () => {
      setErrorFromStm32(true);
      setRetrySerial(true);
    });
  }

  return { stm32Data, socket, errorFromStm32 };
};

export default useStm32;
