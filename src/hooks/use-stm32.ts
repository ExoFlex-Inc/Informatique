import { useState, useEffect } from "react";
import socketIOClient from "socket.io-client"

const ENDPOINT = "http://localhost:3001"; // Your server endpoint

const useStm32 = () => {
  const [stm32Data, setStm32Data] = useState(null);
  const [retrySerial, setRetrySerial] = useState(false);
  const [errorFromStm32, setErrorFromStm32] = useState(false);

  const initializeSerialPort = async () => {
    try {
      console.log("Attempting to initialize STM32 serial port...");
      setRetrySerial(false);
      
      const responseSerialPort = await fetch(
        "http://localhost:3001/initialize-serial-port",
        {
          method: "POST",
        },
      );
      
      if (!responseSerialPort.ok) {
        console.error("Failed to initialize serial port: Check STM32 connection");
        const shouldRetry = window.confirm("Failed to initialize serial port. Check STM32 connection. Retry?");
        setRetrySerial(shouldRetry);
      }
    } catch (error) {
      console.error("An error occurred during serial port initialization:", error);
      setRetrySerial(true);
    }
  };

  useEffect(() => {

    initializeSerialPort();

  }, [retrySerial]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on("serialPortClosed", () => {
      setErrorFromStm32(true)
      setRetrySerial(true)
    });

    socket.on("stm32Data", (message) => {
        console.log(message)
        setStm32Data(message)
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { stm32Data, errorFromStm32 };
};

export default useStm32;
