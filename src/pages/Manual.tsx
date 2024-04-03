import { useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";
import LineChart from "../components/LineChart.tsx";
import AirlineSeatLegroomExtraIcon from '@mui/icons-material/AirlineSeatLegroomExtra';
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import MotorControlWidget from "../components/MotorControlWidget.tsx";

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
  const [positionGraph, setPositionGraph] = useState(true);
  const navigate = useNavigate();
  const handleBackClick = async () => {
    navigate("/");
  };

  const positionData = {
    datasets: [
      {
        label: "Motor 1 position",
        borderColor: "rgb(255, 99, 132)",
        borderDash: [8, 4],
        fill: true,
        data: [],
      },
      {
        label: "Motor 2 position",
        borderColor: "rgb(99, 255, 132)",
        borderDash: [8, 4],
        fill: true,
        data: [],
      },
      {
        label: "Motor 3 position",
        borderColor: "rgb(99, 132, 255)",
        borderDash: [8, 4],
        fill: true,
        data: [],
      },
    ],
  };

  const torqueData = {
    datasets: [
      {
        label: "Motor 1 torque",
        borderColor: "rgb(255, 99, 132)",
        borderDash: [8, 4],
        fill: true,
        data: [],
      },
      {
        label: "Motor 2 torque",
        borderColor: "rgb(99, 255, 132)",
        borderDash: [8, 4],
        fill: true,
        data: [],
      },
      {
        label: "Motor 3 torque",
        borderColor: "rgb(99, 132, 255)",
        borderDash: [8, 4],
        fill: true,
        data: [],
      },
    ],
  };

  return (
    <div className="flex flex-col h-[calc(100vh-32rem)] justify-between">
      <div className="justify-center flex">
        <LineChart chartData={positionGraph ? positionData : torqueData} setPositionGraph={setPositionGraph} positionGraph={positionGraph} />
      </div>
      <div className="flex justify-center">
        <MotorControlWidget title={"Motor Control"} icon={<ComputerRoundedIcon sx={{ fontSize: '56px'}}/>} button1={"Motor1H"} button2={"Motor1AH"} button3={"Motor2H"} button4={"Motor2AH"} button5={"Motor3H"} button6={"Motor3AH"}/>

        <MotorControlWidget title={"Anatomical Movement"} icon={<AirlineSeatLegroomExtraIcon sx={{ fontSize: '56px'}}/>} button1={"EversionL"} button2={"EversionR"} button3={"DorsiflexionU"} button4={"DorsiflexionD"} button5={"ExtensionU"} button6={"ExtensionD"}/>

        <MotorControlWidget title={"Home Settings"} icon={<HomeOutlinedIcon sx={{ fontSize: '56px'}}/>} button1={"GoHome1"} button2={"GoHome2"} button3={"GoHome3"} button4={"GoHome"} button5={"SetHome"}/>
      </div>
    </div>
  );
}
