import { useState, useEffect } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";
import Button from "../components/Button..tsx";

export async function manualInit() {
  try {
    console.log("Attempting to initialize STM32 serial port...");

    const responseSerialPort = await fetch(
      "http://localhost:3001/initialize-serial-port",
      {
        method: "POST",
      },
    );

    if (responseSerialPort.ok) {
      console.log("STM32 serial port initialized successfully.");
      window.alert("STM32 serial port initialized successfully");
      return { loaded: true };
    } else {
      console.error("Failed to initialize serial port: Check STM32 connection");
      return { loaded: false };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return { loaded: false };
  }
}

export default function Manual() {
  const [loaded, setLoaded] = useState(false);
  const [retryInit, setRetryInit] = useState(true); // New state for retry

  useEffect(() => {
    const initialize = async () => {
      const result = await manualInit();
      setLoaded(result.loaded);

      // If initialization fails, prompt the user to retry
      if (!result.loaded) {
        window.confirm("Failed to initialize serial port. Retry?") &&
          initialize();
      } else {
        setRetryInit(false);
      }
    };

    if (retryInit) {
      initialize();
    }
  }, [retryInit]);

  const handleButtonError = (error) => {
    setRetryInit(error);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] justify-center">
      <div className="mt-32 mb-20 flex justify-center">
        <Button
          label="Motor1H"
          mode="Manual"
          action="Increment"
          content="motor1H"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Motor1AH"
          mode="Manual"
          action="Increment"
          content="motor1AH"
          className="mr-8"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Motor2H"
          mode="Manual"
          action="Increment"
          content="motor2H"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Motor2AH"
          mode="Manual"
          action="Increment"
          content="motor2AH"
          className="mr-8"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Motor3H"
          mode="Manual"
          action="Increment"
          content="motor3H"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Motor3AH"
          mode="Manual"
          action="Increment"
          content="motor3AH"
          className="mr-8"
          onError={handleButtonError}
          disabled={!loaded}
        />
      </div>

      <div className="mb-20 flex justify-center">
        <Button
          label="EversionL"
          mode="Manual"
          action="Increment"
          content="eversionL"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="EversionR"
          mode="Manual"
          action="Increment"
          content="eversionR"
          className="mr-8"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="DorsiflexionU"
          mode="Manual"
          action="Increment"
          content="dorsiflexionU"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="DorsiflexionD"
          mode="Manual"
          action="Increment"
          content="dorsiflexionD"
          className="mr-8"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="ExtensionU"
          mode="Manual"
          action="Increment"
          content="extensionU"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="ExtensionD"
          mode="Manual"
          action="Increment"
          content="extensionD"
          className="mr-8"
          onError={handleButtonError}
          disabled={!loaded}
        />
      </div>

      <div className="flex justify-center">
        <Button
          label="Home1"
          mode="Manual"
          action="Homing"
          content="1"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Home2"
          mode="Manual"
          action="Homing"
          content="2"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Home3"
          mode="Manual"
          action="Homing"
          content="3"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="Home"
          mode="Manual"
          action="Homing"
          content="all"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
        <Button
          label="setHome"
          mode="Manual"
          action="Homing"
          content="setHome"
          className="mr-4"
          onError={handleButtonError}
          disabled={!loaded}
        />
      </div>
    </div>
  );
}
