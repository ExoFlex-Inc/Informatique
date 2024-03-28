import { useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";
import Button from "../components/Button..tsx";
import LineChart from "../components/LineChart.tsx";

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

  const data = {
    datasets: [{
      label: 'Dataset 1',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgb(255, 99, 132)',
      borderDash: [8, 4],
      fill: true,
      data: []
    }]
  };

  return (
    <div className="flex flex-col h-[calc(100vh-32rem)] justify-between">
      <div>
        <LineChart chartData={data} />
      </div>
      <div>
        <div className="mt-32 mb-4 flex justify-center">
          <Button label="Motor1H" toSend="motor1H" className="mr-4" />
          <Button label="Motor1AH" toSend="motor1AH" className="mr-8" />
          <Button label="Motor2H" toSend="motor2H" className="mr-4" />
          <Button label="Motor2AH" toSend="motor2AH" className="mr-8" />
          <Button label="Motor3H" toSend="motor3H" className="mr-4" />
          <Button label="Motor3AH" toSend="motor3AH" className="mr-8" />
        </div>

        <div className="mb-4 flex justify-center">
          <Button label="EversionL" toSend="eversionL" className="mr-4" />
          <Button label="EversionR" toSend="eversionR" className="mr-8" />
          <Button label="DorsiflexionU" toSend="dorsiflexionU" className="mr-4" />
          <Button label="DorsiflexionD" toSend="dorsiflexionD" className="mr-8" />
          <Button label="ExtensionU" toSend="extensionU" className="mr-4" />
          <Button label="ExtensionD" toSend="extensionD" className="mr-8" />
        </div>

        <div className="mb-4 flex justify-center">
          <Button label="goHome1" toSend="goHome1" className="mr-4" />
          <Button label="goHome2" toSend="goHome2" className="mr-4" />
          <Button label="goHome3" toSend="goHome3" className="mr-4" />
          <Button label="goHome" toSend="goHome" className="mr-4" />
          <Button label="setHome" toSend="setHome" className="mr-4" />
        </div>
      </div>

    </div>
  );
}
