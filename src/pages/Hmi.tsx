import { useEffect, useState, useRef } from "react";
import ProgressionWidget from "../components/ProgressionWidget.tsx";
import { usePlan } from "../hooks/use-plan.ts";
import useStm32 from "../hooks/use-stm32.ts";

import { useTheme, Box, Grid } from "@mui/material";
import { useUser } from "../hooks/use-user.ts";
import LineChart from "../components/LineChart.tsx";
import { tokens } from "../hooks/theme.ts";
import ExerciseOverviewWidget from "../components/ExerciseOverviewWidget.tsx";
import RatingPopUp from "../components/RatingPopUp.tsx";
import CustomScrollbar from "../components/CustomScrollbars.tsx";
import ManualControl from "../components/ManualControl.tsx";
import Button from "../components/Button.tsx";
import { Pause, PlayArrow, Refresh, Stop, Home } from "@mui/icons-material";
import { useStats } from "../hooks/use-stats.ts";
import { useQueryClient } from "@tanstack/react-query";
interface ChartData {
  datasets: {
    label: string;
    borderColor: string;
    data: { x: number; y: number }[];
  }[];
}

interface Stm32Data {
  AutoState: string;
  Positions: number[];
  Torques: number[];
  Repetitions: number;
  ExerciseIdx: number;
  ErrorCode: number;
  Mode: string;
  HomingState: string;
  CurrentLegSide: string;
  Current: number[];
}

interface PlanData {
  limits: {
    left: {
      angles: {
        eversion: number;
        extension: number;
        dorsiflexion: number;
      };
      torque: {
        eversion: number;
        extension: number;
        dorsiflexion: number;
      };
    };
    right: {
      angles: {
        eversion: number;
        extension: number;
        dorsiflexion: number;
      };
      torque: {
        eversion: number;
        extension: number;
        dorsiflexion: number;
      };
    };
  };
  plan: PlanSet[];
}

interface PlanSet {
  movement: Movement[];
  repetitions: number;
  rest: number;
  time: number;
  speed: number;
}

interface Movement {
  exercise: string;
  target_angle: number;
  target_torque: number;
}

export default function HMI() {
  const { user } = useUser();
  const { stats } = useStats();
  const { planData } = usePlan(user?.user_id) as {
    planData: PlanData | undefined;
  };
  const queryClient = useQueryClient();

  const { stm32Data, socket, errorFromStm32 } = useStm32() as {
    stm32Data: Stm32Data | null | undefined;
    socket: any;
    errorFromStm32: boolean;
  };
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [openDialogPainScale, setOpenDialogPainScale] =
    useState<boolean>(false);
  const [painScale, setPainScale] = useState<number>(0);

  const hasExecute = useRef(false);
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
      socket.emit("sendDataToStm32", message);
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
      let message = `{Auto;Plan;${planData.limits.left.angles.dorsiflexion};${planData.limits.left.torque.dorsiflexion};${planData.limits.left.angles.eversion};${planData.limits.left.torque.eversion};${planData.limits.left.angles.extension};${planData.limits.left.torque.extension};${planData.limits.right.angles.dorsiflexion};${planData.limits.right.torque.dorsiflexion};${planData.limits.right.angles.eversion};${planData.limits.right.torque.eversion};${planData.limits.right.angles.extension};${planData.limits.right.torque.extension}`;

      planData.plan.forEach((set) => {
        message += `;${set.movement.length}`;
        for (let i = 0; i < 3; i++) {
          if (i <= set.movement.length - 1) {
            const movement = set.movement[i];
            message += `;${movement?.exercise ?? 0};${movement?.target_angle ?? 0};${movement?.target_torque ?? 0}`;
          } else {
            message += `;${0};${0};${0}`;
          }
        }
        message += `;${set.repetitions};${set.rest};${set.time};${set.speed}`;
      });
      message += "}";
      console.log("plan", message);
      socket.emit("sendDataToStm32", message);
    }
  }, [stm32Data, planData, socket]);

  useEffect(() => {
    const stopRecording = async () => {
      if (stm32Data?.AutoState === "Stop" || stm32Data?.Mode === "Error") {
        try {
          const response = await fetch("http://localhost:3001/stm32/record", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              start: false,
            }),
            credentials: "include",
          });

          if (response.ok) {
            console.log("Recording stopped successfully.");
          } else {
            console.error("Failed to stop recording.");
          }
        } catch (error) {
          console.error("An error occurred:", error);
        }
      }
    };

    stopRecording();
  }, [stm32Data]);

  useEffect(() => {
    if (
      stm32Data?.AutoState === "Stretching" &&
      planData?.plan &&
      stm32Data.ExerciseIdx < planData.plan.length
    ) {
      const currentSet = planData.plan[stm32Data.ExerciseIdx] ?? {
        movement: [],
      };
      const currentExercise = currentSet.movement[0]?.exercise;

      if (
        currentExercise === "Dorsiflexion" ||
        currentExercise === "Eversion"
      ) {
        setChartData((prevChartData) => {
          const newData = [...prevChartData.datasets];
          if (newData[0] && newData[1]) {
            newData[0].data.push({
              x: stm32Data.Repetitions,
              y: stm32Data.Positions[1] ?? 0,
            });
            newData[1].data.push({
              x: stm32Data.Repetitions,
              y: stm32Data.Torques[1] ?? 0,
            });
          }
          return { ...prevChartData, datasets: newData };
        });
      } else if (currentExercise === "Extension") {
        setChartData((prevChartData) => {
          const newData = [...prevChartData.datasets];
          if (newData[0] && newData[1]) {
            newData[0].data.push({
              x: stm32Data.Repetitions,
              y: stm32Data.Positions[2] ?? 0,
            });
            newData[1].data.push({
              x: stm32Data.Repetitions,
              y: stm32Data.Torques[2] ?? 0,
            });
          }
          return { ...prevChartData, datasets: newData };
        });
      }
    }
  }, [stm32Data?.AutoState, stm32Data?.Repetitions]);

  useEffect(() => {
    if (stm32Data?.Repetitions === 0) {
      setChartData((prevChartData) => {
        if (prevChartData.datasets[0] && prevChartData.datasets[1]) {
          return {
            datasets: [
              {
                ...prevChartData.datasets[0],
                data: [],
                label: prevChartData.datasets[0].label,
                borderColor: prevChartData.datasets[0].borderColor,
              },
              {
                ...prevChartData.datasets[1],
                data: [],
                label: prevChartData.datasets[1].label,
                borderColor: prevChartData.datasets[1].borderColor,
              },
            ],
          };
        }
        return prevChartData;
      });
    }
  }, [stm32Data?.Repetitions]);

  useEffect(() => {
    if (painScale && user?.user_id) {
      const requestBody = {
        stats: stats,
        rated_pain: painScale,
        user_id: user.user_id,
      };
      const fetchData = async () => {
        try {
          const exerciseData = await fetch(
            `http://localhost:3001/exercise-data/${user.user_id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
              credentials: "include",
            },
          );

          if (exerciseData.ok) {
            console.log("Data saved successfully.");
            queryClient.invalidateQueries({ queryKey: ["topUsers"] });
            queryClient.invalidateQueries({
              queryKey: ["stats", user.user_id],
            });
          } else {
            console.error("Failed to save the data.");
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
      <CustomScrollbar>
        <Box>
          <Grid
            padding={5}
            container
            spacing={2}
            sx={{ justifyContent: "center", alignItems: "center" }}
          >
            <Grid item xs={12}>
              <Box
                gap={4}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                {stm32Data?.AutoState == "WaitingForPlan" ||
                stm32Data?.AutoState == "Ready" ? (
                  <Button
                    mainColor="#2fb73d"
                    hoverColor="#33a63f"
                    mode="Auto"
                    action="Control"
                    content="Start"
                    icon={<PlayArrow />}
                  />
                ) : (
                  <Button
                    mainColor="#f5d50b"
                    hoverColor="#dcc21d"
                    mode="Auto"
                    action="Control"
                    content="Pause"
                    icon={<Pause />}
                  />
                )}
                <Button
                  icon={<Stop />}
                  mode="Auto"
                  action="Control"
                  content="Stop"
                  mainColor="#e41b1b"
                  hoverColor="#cb2626"
                  disabled={
                    !stm32Data ||
                    errorFromStm32 ||
                    stm32Data?.AutoState === "Ready"
                  }
                />
                <Button
                  mainColor="#1ec6e1"
                  hoverColor="#2aa6ba"
                  icon={<Home />}
                  disabled={
                    stm32Data?.AutoState !== "Ready" &&
                    stm32Data?.AutoState !== "WaitingForPlan"
                  }
                  mode="Homing"
                />
                <Button
                  mainColor="#f1910f"
                  hoverColor="#d08622"
                  icon={<Refresh />}
                  disabled={!stm32Data?.ErrorCode}
                  mode="Reset"
                />
              </Box>
              <LineChart
                chartData={chartData}
                type="line"
                title="Exercise Progression"
              />
            </Grid>
            <Grid item>
              <Box padding={1} bgcolor="white" sx={{ borderRadius: "16px" }}>
                <ProgressionWidget
                  setOpenDialogPainScale={setOpenDialogPainScale}
                  stm32Data={stm32Data}
                  planData={planData}
                />
              </Box>
            </Grid>
            <Grid item>
              <ExerciseOverviewWidget
                stm32Data={stm32Data}
                planData={planData}
              />
            </Grid>
          </Grid>
        </Box>
      </CustomScrollbar>
      <RatingPopUp
        setOpenDialogPainScale={setOpenDialogPainScale}
        setPainScale={setPainScale}
        openDialogPainScale={openDialogPainScale}
      />
      <ManualControl
        errorFromStm32={errorFromStm32}
        stm32Data={stm32Data ?? null}
      />
    </div>
  );
}
