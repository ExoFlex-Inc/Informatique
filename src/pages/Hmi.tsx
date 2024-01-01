import { useState, useRef } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";
import Button from "../components/Button..tsx";

export async function hmiInit() {
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

      console.log("Attempting to fetch patient data...");

      const responseDataFetch = await fetch(
        "http://localhost:3001/fetch-patient-data",
        {
          method: "POST",
        },
      );

      if (responseDataFetch.ok) {
        console.log("Patient data fetched successfully.");
        return { loaded: true };
      } else {
        console.error("Failed to fetch patient data");
        return redirect("/home");
      }
    } else {
      console.error("Failed to initialize serial port");
      return redirect("/home");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return redirect("/home");
  }
}

export default function HMI() {
  const [leftButton, setLeftButton] = useState("eversionL");
  const [rightButton, setRightButton] = useState("eversionR");

  const navigate = useNavigate();

  const handleNextClick = () => {
    setRightButton("dorsiflexionU");
    setLeftButton("dorsiflexionD");
  };

  const handleBackClick = async () => {
    if (leftButton === "dorsiflexionD") {
      setRightButton("eversionR");
      setLeftButton("eversionL");
    } else {
      const response = await fetch("http://localhost:3001/reset-serial-port", {
        method: "POST",
      });

      if (response.ok) {
        navigate("/home");
      } else {
        console.log("Failed to reset machineData");
        navigate("/home");
      }
    }
  };

  const sendDataToSupabase = async () => {
    const { data } = await supaClient.auth.getSession();

    const access_token = data.session?.access_token;
    const refresh_token = data.session?.refresh_token;

    const requestBody = {
      access_token: access_token,
      refresh_token: refresh_token,
    };

    const response = await fetch("http://localhost:3001/push-supabase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      console.log("Data pushed to supabase");
    } else {
      console.error("Failed to close serial port.");
    }

    const response2 = await fetch("http://localhost:3001/reset-serial-port", {
      method: "POST",
    });

    if (response2.ok) {
      navigate("/home");
      console.log("Serial port deconnected and machineData reset");
    } else {
      console.log("Failed to reset machineData");
    }
  };
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] justify-end">
      <div className="mb-10 flex justify-center">
        <Button
          label={leftButton === "eversionL" ? "EversionL" : "DorsiflexionD"}
          toSend={leftButton}
          className="mr-2"
        />
        <button
          onClick={() => sendDataToSupabase()}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Send data
        </button>
        <Button
          label={rightButton === "eversionR" ? "EversionR" : "DorsiflexionU"}
          toSend={rightButton}
        />
        {leftButton === "dorsiflexionD" && (
          <Button label="ExtensionD" toSend="extensionD" className="mr-2" />
        )}
        {rightButton === "dorsiflexionU" && (
          <Button label="ExtensionU" toSend="extensionU" />
        )}
      </div>
      <div className="flex justify-between p-5">
        <Button label="Back" onClick={handleBackClick} />
        <Button label="Next" onClick={handleNextClick} />
      </div>
    </div>
  );
}
