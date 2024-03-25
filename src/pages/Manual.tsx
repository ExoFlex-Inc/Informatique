import { useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";
import Button from "../components/Button..tsx";

export async function manualInit(navigate) {
  try {
    console.log("Attempting to initialize serial port...");

    const responseSerialPort = await fetch(
      "http://localhost:3001/initialize-serial-port",
      {
        method: "POST",
      },
    );

    if (responseSerialPort.ok) {
      console.log("Serial port initialized successfully.");
      return { loaded: true };
    } else {
      console.error(
        "Failed to initialize serial port: Check STM32 connection ",
      );
      window.alert("Failed to initialize serial port: Check STM32 connection ");
      return navigate("/");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    window.alert("An error occurred: " + error);
    return navigate("/");
  }
}

export default function Manual() {
  const navigate = useNavigate();

  const handleBackClick = async () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] justify-between">
      <div className="mt-32 mb-4 flex justify-center">
        <Button label="Motor1H" mode="Manual" action="Increment" content ="motor1H" className="mr-4" />
        <Button label="Motor1AH" mode="Manual" action="Increment" content ="motor1AH" className="mr-8" />
        <Button label="Motor2H" mode="Manual" action="Increment" content ="motor2H" className="mr-4" />
        <Button label="Motor2AH" mode="Manual" action="Increment" content ="motor2AH" className="mr-8" />
        <Button label="Motor3H" mode="Manual" action="Increment" content ="motor3H" className="mr-4" />
        <Button label="Motor3AH" mode="Manual" action="Increment" content ="motor3AH" className="mr-8" />
      </div>

      <div className="mb-4 flex justify-center">
        <Button label="EversionL" mode="Manual" action="Increment" content ="eversionL" className="mr-4" />
        <Button label="EversionR" mode="Manual" action="Increment" content ="eversionR" className="mr-8" />
        <Button label="DorsiflexionU" mode="Manual" action="Increment" content ="dorsiflexionU" className="mr-4" />
        <Button label="DorsiflexionD" mode="Manual" action="Increment" content ="dorsiflexionD" className="mr-8" />
        <Button label="ExtensionU" mode="Manual" action="Increment" content ="extensionU" className="mr-4" />
        <Button label="ExtensionD" mode="Manual" action="Increment" content ="extensionD" className="mr-8" />
      </div>

      <div className="mb-4 flex justify-center">
        <Button label="Home1" mode="Manual" action="Homing" content="1" className="mr-4" />
        <Button label="Home2" mode="Manual" action="Homing" content ="2" className="mr-4" />
        <Button label="Home3" mode="Manual" action="Homing" content ="3" className="mr-4" />
        <Button label="Home" mode="Manual" action="Homing" content ="all" className="mr-4" />
        <Button label="setHome" mode="Manual" action="Homing" content ="setHome" className="mr-4" />
      </div>

      <div className="flex justify-start p-5">
        <Button label="Back" onClick={handleBackClick} />
      </div>
    </div>
  );
}
