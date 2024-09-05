import React, { useEffect, useState, SetStateAction, Dispatch } from "react";
import Button from "../components/Button.tsx";
import ProgressionWidget from "../components/ProgressionWidget.tsx";

import usePlanData from "../hooks/get-plan.ts";
import useStm32 from "../hooks/use-stm32.ts";

import { useMediaQuery, useTheme } from "@mui/material";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LineChart from "../components/LineChart.tsx";
import { tokens } from "../hooks/theme.ts";
import ExerciseOverviewWidget from "../components/ExerciseOverviewWidget.tsx";

interface ChartData {
  datasets: {
    label: string;
    borderColor: string;
    data: { x: number; y: number }[];
  }[];
}

export default function HMI() {
  const { planData } = usePlanData();
  const { stm32Data, socket, errorFromStm32 } = useStm32();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const isTablet = useMediaQuery("(max-width: 768px)");

  const [chartData, setChartData] = useState<ChartData>({
    datasets: [
      {
        label: "Amplitude(°)",
        borderColor: `${colors.blueAccent[500]}`,
        data: [],
      },
      {
        label: "Rigidity(Nm)",
        borderColor: `${colors.greenAccent[500]}`,
        data: [],
      },
    ],
  });

  useEffect(() => {
    if (
      stm32Data &&
      stm32Data.AutoState === "WaitingForPlan" &&
      planData &&
      socket
    ) {
      let message = `{Auto;Plan;${planData.limits.left.angles.eversion};${planData.limits.right.angles.eversion};
        ${planData.limits.left.angles.extension};${planData.limits.right.angles.extension};
        ${planData.limits.left.angles.dorsiflexion};${planData.limits.right.angles.dorsiflexion};
        ${planData.limits.left.torque.eversion};${planData.limits.right.torque.eversion};
        ${planData.limits.left.torque.extension};${planData.limits.right.torque.extension};
        ${planData.limits.left.torque.dorsiflexion};${planData.limits.right.torque.dorsiflexion}`;
       
      planData.plan.forEach((set) => {
        message += `;${set.movement.length}`
        for (var i = 1; i < 4; i++) {
          if (i <= set.movement.length) {
            message += `;${exercise.exercise};${exercise.target_angle};${exercise.target_torque}`;
          } else {
            message += `;${0};${0};${0}`;
          }
        }
        message += `;${set.repetitions};${set.rest};${set.time};${set.speed}`;
      });
      message += ";}";
      socket.emit("planData", message);
    }
  }, [stm32Data, planData, socket]);

  useEffect(() => {
    if (stm32Data?.AutoState === "Stretching") {
      if (
        planData?.plan[stm32Data.ExerciseIdx].exercise === "Dorsiflexion" ||
        planData?.plan[stm32Data.ExerciseIdx].exercise === "Eversion"
      ) {
        setChartData((prevChartData) => {
          const newData = [...prevChartData.datasets];
          newData[0].data.push({
            x: stm32Data.Repetitions,
            y: stm32Data.Positions[1],
          });
          newData[1].data.push({
            x: stm32Data.Repetitions,
            y: stm32Data.Torques[1],
          });
          return { ...prevChartData, datasets: newData };
        });
      } else if (
        planData?.plan[stm32Data.ExerciseIdx].exercise === "Extension"
      ) {
        setChartData((prevChartData) => {
          const newData = [...prevChartData.datasets];
          newData[0].data.push({
            x: stm32Data.Repetitions,
            y: stm32Data.Positions[2],
          });
          newData[1].data.push({
            x: stm32Data.Repetitions,
            y: stm32Data.Torques[2],
          });
          return { ...prevChartData, datasets: newData };
        });
      }
    }
  }, [stm32Data?.AutoState]);

  useEffect(() => {
    if (stm32Data?.Repetitions === 0) {
      setChartData((prevChartData) => ({
        datasets: [
          { ...prevChartData.datasets[0], data: [] },
          { ...prevChartData.datasets[1], data: [] },
        ],
      }));
    }
  }, [stm32Data?.Repetitions]);

  return (
    <div className="plan-grid grid-cols-2 grid-rows-2 gap-4 custom-height mr-10 ml-10">
      <div className="bg-white rounded-2xl flex items-center h-auto">
        <LineChart chartData={chartData} type="line" socket={socket} />
      </div>
      <div className="bg-white rounded-2xl content-evenly">
        <ProgressionWidget stm32Data={stm32Data} planData={planData} />
      </div>
      <div className="bg-white col-span-1 flex flex-col justify-around rounded-2xl mb-5">
        <div className="flex justify-between mt-5 ml-10 mr-10">
          {stm32Data &&
          stm32Data.AutoState !== "Ready" &&
          stm32Data.AutoState !== "WaitingForPlan" ? (
            <Button
              label="Pause"
              icon={<PauseIcon />}
              mode="Auto"
              action="Control"
              content="Pause"
              disabled={!stm32Data || errorFromStm32}
              color="bg-yellow-500"
            />
          ) : (
            <Button
              label="Start"
              icon={<PlayArrowIcon />}
              mode="Auto"
              action="Control"
              content="Start"
              disabled={
                !stm32Data ||
                errorFromStm32 ||
                stm32Data.AutoState === "WaitingForPlan"
              }
              color="bg-green-500"
            />
          )}
          <Button
            label="Stop"
            icon={<StopIcon />}
            mode="Auto"
            action="Control"
            content="Stop"
            disabled={
              !stm32Data || errorFromStm32 || stm32Data?.AutoState === "Ready"
            }
            color="bg-red-500"
          />
        </div>
        {stm32Data?.AutoState === "Dorsiflexion" && (
          <div className="flex justify-between ml-10 mr-10 items-center">
            <Button
              label="DorsiflexionUp"
              icon={<ArrowUpwardIcon />}
              mode="Auto"
              action="Calib"
              content="dorsiflexionU"
              disabled={!stm32Data || errorFromStm32}
              color="bg-gray-500"
            />
            <Button
              label="DorsiflexionDown"
              icon={<ArrowDownwardIcon />}
              mode="Auto"
              action="Calib"
              content="dorsiflexionD"
              disabled={!stm32Data || errorFromStm32}
              color="bg-gray-500"
            />
          </div>
        )}
        {stm32Data?.AutoState === "Extension" && (
          <div className="flex justify-between ml-10 mr-10 items-center">
            <Button
              label="ExtensionUp"
              icon={<ArrowUpwardIcon />}
              mode="Auto"
              action="Calib"
              content="extensionU"
              disabled={!stm32Data || errorFromStm32}
              color="bg-gray-500"
            />
            <Button
              label="ExtensionDown"
              icon={<ArrowDownwardIcon />}
              mode="Auto"
              action="Calib"
              content="extensionD"
              disabled={!stm32Data || errorFromStm32}
              color="bg-gray-500"
            />
          </div>
        )}
        {stm32Data?.AutoState === "Eversion" && (
          <div className="flex justify-between ml-10 mr-10 items-center">
            <Button
              label="EversionLeft"
              icon={<RotateLeftIcon />}
              mode="Auto"
              action="Calib"
              content="eversionL"
              disabled={!stm32Data || errorFromStm32}
              color="bg-gray-500"
            />
            <Button
              label="EversionRight"
              icon={<RotateRightIcon />}
              mode="Auto"
              action="Calib"
              content="eversionR"
              disabled={!stm32Data || errorFromStm32}
              color="bg-gray-500"
            />
          </div>
        )}
      </div>
      <ExerciseOverviewWidget stm32Data={stm32Data} />
    </div>
  );
}
