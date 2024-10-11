import React, {
  useEffect,
  useState,
  useRef,
} from "react";
import Button from "../components/Button.tsx";
import ProgressionWidget from "../components/ProgressionWidget.tsx";

import { usePlan } from "../hooks/use-plan.ts";
import useStm32 from "../hooks/use-stm32.ts";

import { useMediaQuery, useTheme } from "@mui/material";
import { useUserProfile } from "../hooks/use-profile.ts";

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
import RatingPopUp from "../components/RatingPopUp.tsx";
import ToggleSide from "../components/ToggleSide.tsx";
import { Side } from "../components/ToggleSide.tsx";
import CustomScrollbar from "../components/CustomScrollbars.tsx";
interface ChartData {
  datasets: {
    label: string;
    borderColor: string;
    data: { x: number; y: number }[];
  }[];
}

export default function HMI() {
  const { profile } = useUserProfile();
  const { planData } = usePlan(profile?.user_id);
  const { stm32Data, socket, errorFromStm32 } = useStm32();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [openDialogPainScale, setOpenDialogPainScale] = useState(false);
  const [painScale, setPainScale] = useState<number>(0);

  const isTablet = useMediaQuery("(max-width: 768px)");

  const hasExecute = useRef(false);
  const [side, setSide] = useState<Side>("Left");

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
      socket &&
      stm32Data &&
      stm32Data.AutoState === "Ready" &&
      !hasExecute.current
    ) {
      const message = "{Auto;Resetplan;}";
      socket?.emit("planData", message);
      hasExecute.current = true;
      console.log("Reset", message);
    }
  }, [socket, stm32Data]);

  useEffect(() => {
    if (
      stm32Data &&
      stm32Data.AutoState === "WaitingForPlan" &&
      planData &&
      socket
    ) {
      let message = `{Auto;Plan;${planData.limits.left.angles.eversion};${planData.limits.right.angles.eversion};${planData.limits.left.angles.extension};${planData.limits.right.angles.extension};${planData.limits.left.angles.dorsiflexion};${planData.limits.right.angles.dorsiflexion};${planData.limits.left.torque.eversion};${planData.limits.right.torque.eversion};${planData.limits.left.torque.extension};${planData.limits.right.torque.extension};${planData.limits.left.torque.dorsiflexion};${planData.limits.right.torque.dorsiflexion}`;
      planData.plan.forEach((set) => {
        message += `;${set.movement.length}`;
        for (var i = 0; i < 3; i++) {
          if (i <= set.movement.length - 1) {
            message += `;${set.movement[i].exercise};${set.movement[i].target_angle};${set.movement[i].target_torque}`;
          } else {
            message += `;${0};${0};${0}`;
          }
        }
        message += `;${set.repetitions};${set.rest};${set.time};${set.speed}`;
      });
      message += "}";
      console.log("plan", message);
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

  useEffect(() => {
    if (painScale) {
      const date = Date.now();
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "numeric",
      });
      const requestBody = {
        date: formattedDate,
        rated_pain: painScale,
        user_id: profile.user_id,
      };
      const fetchData = async () => {
        try {
          const exerciseData = await fetch(
            `http://localhost:3001/exercise-data/${profile.user_id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            },
          );

          if (exerciseData.ok) {
            console.log("Serial port initialized successfully.");
          } else {
            console.error("Failed to initialize the serial port.");
          }
        } catch (error) {
          console.error("An error occurred:", error);
        }
      };

      fetchData();
    }
  }, [painScale]);

  return (
    <div className="flex flex-col custom-height">
      <div className="ml-10">
        <ToggleSide side={side} setSide={setSide} />
      </div>
      <CustomScrollbar>
        <div className="plan-grid grid-cols-2 grid-rows-2 gap-4 mr-10 ml-10 ">
          <div className="bg-white rounded-2xl flex items-center h-auto">
            <LineChart chartData={chartData} type="line" socket={socket} />
          </div>
          <div className="bg-white rounded-2xl content-evenly">
            <ProgressionWidget
          setOpenDialogPainScale={setOpenDialogPainScale}
          stm32Data={stm32Data}
          planData={planData}
        />
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
          <ExerciseOverviewWidget stm32Data={stm32Data} planData={planData} />
      <RatingPopUp
        setOpenDialogPainScale={setOpenDialogPainScale}
        setPainScale={setPainScale}
        openDialogPainScale={openDialogPainScale}
      />
        </div>
      </CustomScrollbar>
    </div>
  );
}
