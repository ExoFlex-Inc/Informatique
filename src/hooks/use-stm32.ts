import { useState, useEffect } from "react";
import socketIOClient, { Socket } from "socket.io-client";

// Define the type of events if needed
interface MyEvents {
  stm32Data: string;
  serialPortClosed: string;
}

const ENDPOINT = "http://localhost:3001"; 

const useStm32 = () => {
  const [stm32Data, setStm32Data] = useState<string | null>(null);
  const [retrySerial, setRetrySerial] = useState<boolean>(true);
  const [errorFromStm32, setErrorFromStm32] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket<MyEvents> | null>(null);

  const initializeSerialPort = async () => {
    try {
      console.log("Attempting to initialize STM32 serial port...");
      setRetrySerial(false);

      const responseSerialPort = await fetch(
        "http://localhost:3001/api/initialize-serial-port",
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
    }
  }, [retrySerial]);

  useEffect(() => {
    const newSocket = socketIOClient(ENDPOINT) as Socket<MyEvents>;
    setSocket(newSocket);

    newSocket.on("serialPortClosed", () => {
      setErrorFromStm32(true);
      setRetrySerial(true);
    });

    newSocket.on("stm32Data", (message) => {
      // console.log(message)
      setStm32Data(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return { stm32Data, socket, errorFromStm32 };
};

export default useStm32;
