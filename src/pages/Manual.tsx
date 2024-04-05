import { useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "../hooks/supa-client.ts";
import LineChart from "../components/LineChart.tsx";
import AirlineSeatLegroomExtraIcon from '@mui/icons-material/AirlineSeatLegroomExtra';
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import MotorControlWidget from "../components/MotorControlWidget.tsx";

export default function Manual() {
  const [graphDataIsPosition, setGraphDataIsPosition] = useState(true);

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
        <LineChart chartData={graphDataIsPosition ? positionData : torqueData} setGraphDataIsPosition={setGraphDataIsPosition} graphDataIsPosition={graphDataIsPosition} />
      </div>
      <div className="flex justify-center">
        <MotorControlWidget title={"Motor Control"} icon={<ComputerRoundedIcon sx={{ fontSize: '56px'}}/>} labels={["Motor1H", "Motor1AH", "Motor2H", "Motor2AH", "Motor3H", "Motor3AH"]} mode="Manual" action="Increment" className="bg-blue-600 text-base w-28 h-14 mr-4 mt-4 ml-4" />

        <MotorControlWidget title={"Anatomical Movement"} icon={<AirlineSeatLegroomExtraIcon sx={{ fontSize: '56px'}}/>} labels={["EversionL", "EversionR", "DorsiflexionU", "DorsiflexionD", "ExtensionU", "ExtensionD"]} mode="Manual" action="Increment" className="bg-blue-600 text-base w-28 h-14 mr-4 mt-4 ml-4"/>

        <MotorControlWidget title={"Home Settings"} icon={<HomeOutlinedIcon sx={{ fontSize: '56px'}}/>} labels={["GoHome1", "GoHome2", "GoHome3", "GoHome", "SetHome"]} mode="Manual" action="Homing" className="bg-blue-600 text-base w-28 h-14 mr-4 mt-4 ml-4"/>
      </div>
    </div>
  );
}