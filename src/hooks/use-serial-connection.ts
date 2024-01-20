import { useState, useEffect } from "react";

const useSerialConnection = () => {
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseSerialPort = await fetch(
          "http://localhost:3001/initialize-serial-port",
          {
            method: "POST",
          },
        );

        if (responseSerialPort.ok) {
          console.log("Serial port initialized successfully.");
          setIsConnected(true);
        } else {
          console.error("Failed to initialize the serial port.");
          setError("Failed to initialize the serial port.");
        }
      } catch (error) {
        console.error("An error occurred:", error);
        setError("An error occurred.");
      }
    };

    fetchData();
  }, []);

  return { isConnected, error };
};

export default useSerialConnection;
