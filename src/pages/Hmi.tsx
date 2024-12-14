import { useEffect, useState, useRef } from "react";
import ProgressionWidget from "../components/ProgressionWidget.tsx";
import { usePlan } from "../hooks/use-plan.ts";
import useStm32 from "../hooks/use-stm32.ts";

import {
  useTheme,
  Box,
  Grid,
  Paper,
  IconButton,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useUser } from "../hooks/use-user.ts";
import LineChart from "../components/LineChart.tsx";
import { tokens } from "../hooks/theme.ts";
import ExerciseOverviewWidget from "../components/ExerciseOverviewWidget.tsx";
import RatingPopUp from "../components/RatingPopUp.tsx";
import ManualControl from "../components/ManualControl.tsx";
import Button from "../components/Button.tsx";
import { Pause, PlayArrow, Refresh, Stop, Home } from "@mui/icons-material";
import { useStats } from "../hooks/use-stats.ts";
import { useQueryClient } from "@tanstack/react-query";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import HmiButtonClick from "../components/HmiButtonClick.tsx";

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
  Speed: number[];
  Repetitions: number;
  ExerciseIdx: number;
  ErrorCode: string;
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
  const { planData } = usePlan(user?.user_id) as {
    planData: PlanData | undefined;
  };
  const [recordCsv, setRecordCsv] = useState(false);
  const queryClient = useQueryClient();

  const { stm32Data, socket } = useStm32() as {
    stm32Data: Stm32Data | null;
    socket: any;
  };
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [openDialogPainScale, setOpenDialogPainScale] =
    useState<boolean>(false);
  const [painScale, setPainScale] = useState<number>(0);

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
  const [latestMotorData, setLatestMotorData] = useState({
    motor1: { x: 0, position: 0, torque: 0, current: 0 },
    motor2: { x: 0, position: 0, torque: 0, current: 0 },
    motor3: { x: 0, position: 0, torque: 0, current: 0 },
  });
  const [graphDataType, setGraphDataType] = useState("position");
  const resetPlanInterval = useRef<number | null>(null);
  const planInterval = useRef<number | null>(null);
  const planTimeoutRef = useRef<number | null>(null);
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) {
      return;
    }

    // Check if necessary variables are available
    if (stm32Data && stm32Data.AutoState === "Ready" && planData) {
      effectRan.current = true; // Set the flag to prevent future runs

      console.log("Ready state detected, sending reset message...");

      const resetMessage = "{Auto;Resetplan;}";
      console.log("Reset plan message:", resetMessage);
      socket.emit("sendDataToStm32", resetMessage);

      // Set a timeout to send the plan after 100ms
      planTimeoutRef.current = window.setTimeout(() => {
        try {
          let planMessage = `{Auto;Plan;${planData.limits.left.angles.dorsiflexion};${planData.limits.left.torque.dorsiflexion};${planData.limits.left.angles.eversion};${planData.limits.left.torque.eversion};${planData.limits.left.angles.extension};${planData.limits.left.torque.extension};${planData.limits.right.angles.dorsiflexion};${planData.limits.right.torque.dorsiflexion};${planData.limits.right.angles.eversion};${planData.limits.right.torque.eversion};${planData.limits.right.angles.extension};${planData.limits.right.torque.extension}`;

          planData.plan.forEach((set) => {
            planMessage += `;${set.movement.length}`;
            for (let i = 0; i < 3; i++) {
              if (i < set.movement.length) {
                const movement = set.movement[i];
                planMessage += `;${movement?.exercise ?? 0};${movement?.target_angle ?? 0};${movement?.target_torque ?? 0}`;
              } else {
                planMessage += `;0;0;0`;
              }
            }
            planMessage += `;${set.repetitions};${set.rest};${set.time};${set.speed}`;
          });
          planMessage += "}";

          console.log("Plan message:", planMessage);
          socket.emit("sendDataToStm32", planMessage);
        } catch (error) {
          console.log("Conditions not met:", { stm32Data, planData, socket });
        }
      }, 100); // 100ms delay
    }
  }, [stm32Data?.AutoState, planData]);

  useEffect(() => {
    // Cleanup any existing intervals before setting new ones
    if (resetPlanInterval.current !== null) {
      window.clearInterval(resetPlanInterval.current);
      resetPlanInterval.current = null;
    }
    if (planInterval.current !== null) {
      window.clearInterval(planInterval.current);
      planInterval.current = null;
    }

    if (stm32Data && stm32Data.AutoState === "WaitingForPlan" && planData) {
      console.log("WaitingForPlan detected, starting intervals...");

      // Use window.setInterval and assign to number
      resetPlanInterval.current = window.setInterval(() => {
        const resetMessage = "{Auto;Resetplan;}";
        console.log("Reset plan message:", resetMessage);
        socket.emit("sendDataToStm32", resetMessage);
      }, 1000);

      planInterval.current = window.setInterval(() => {
        let planMessage = `{Auto;Plan;${planData.limits.left.angles.dorsiflexion};${planData.limits.left.torque.dorsiflexion};${planData.limits.left.angles.eversion};${planData.limits.left.torque.eversion};${planData.limits.left.angles.extension};${planData.limits.left.torque.extension};${planData.limits.right.angles.dorsiflexion};${planData.limits.right.torque.dorsiflexion};${planData.limits.right.angles.eversion};${planData.limits.right.torque.eversion};${planData.limits.right.angles.extension};${planData.limits.right.torque.extension}`;

        planData.plan.forEach((set) => {
          planMessage += `;${set.movement.length}`;
          for (let i = 0; i < 3; i++) {
            if (i < set.movement.length) {
              const movement = set.movement[i];
              planMessage += `;${movement?.exercise ?? 0};${movement?.target_angle ?? 0};${movement?.target_torque ?? 0}`;
            } else {
              planMessage += `;0;0;0`;
            }
          }
          planMessage += `;${set.repetitions};${set.rest};${set.time};${set.speed}`;
        });
        planMessage += "}";

        console.log("Plan message:", planMessage);
        socket.emit("sendDataToStm32", planMessage);
      }, 1100);
    }

    // Cleanup function
    return () => {
      if (resetPlanInterval.current !== null) {
        window.clearInterval(resetPlanInterval.current);
        resetPlanInterval.current = null;
      }
      if (planInterval.current !== null) {
        window.clearInterval(planInterval.current);
        planInterval.current = null;
      }
    };
  }, [stm32Data?.AutoState, planData]);

  useEffect(() => {
    // Cleanup any existing intervals before setting new ones
    if (resetPlanInterval.current !== null) {
      window.clearInterval(resetPlanInterval.current);
      resetPlanInterval.current = null;
    }
    if (planInterval.current !== null) {
      window.clearInterval(planInterval.current);
      planInterval.current = null;
    }

    if (stm32Data && stm32Data.AutoState === "WaitingForPlan" && planData) {
      console.log("WaitingForPlan detected, starting intervals...");

      // Use window.setInterval and assign to number
      resetPlanInterval.current = window.setInterval(() => {
        const resetMessage = "{Auto;Resetplan;}";
        console.log("Reset plan message:", resetMessage);
        socket.emit("sendDataToStm32", resetMessage);
      }, 1000);

      planInterval.current = window.setInterval(() => {
        let planMessage = `{Auto;Plan;${planData.limits.left.angles.dorsiflexion};${planData.limits.left.torque.dorsiflexion};${planData.limits.left.angles.eversion};${planData.limits.left.torque.eversion};${planData.limits.left.angles.extension};${planData.limits.left.torque.extension};${planData.limits.right.angles.dorsiflexion};${planData.limits.right.torque.dorsiflexion};${planData.limits.right.angles.eversion};${planData.limits.right.torque.eversion};${planData.limits.right.angles.extension};${planData.limits.right.torque.extension}`;

        planData.plan.forEach((set) => {
          planMessage += `;${set.movement.length}`;
          for (let i = 0; i < 3; i++) {
            if (i < set.movement.length) {
              const movement = set.movement[i];
              planMessage += `;${movement?.exercise ?? 0};${movement?.target_angle ?? 0};${movement?.target_torque ?? 0}`;
            } else {
              planMessage += `;0;0;0`;
            }
          }
          planMessage += `;${set.repetitions};${set.rest};${set.time};${set.speed}`;
        });
        planMessage += "}";

        console.log("Plan message:", planMessage);
        socket.emit("sendDataToStm32", planMessage);
      }, 1100);
    }

    // Cleanup function
    return () => {
      if (resetPlanInterval.current !== null) {
        window.clearInterval(resetPlanInterval.current);
        resetPlanInterval.current = null;
      }
      if (planInterval.current !== null) {
        window.clearInterval(planInterval.current);
        planInterval.current = null;
      }
    };
  }, [stm32Data?.AutoState, planData]);

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
              state: "stop",
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
      } else if (stm32Data?.AutoState === "Ready") {
        try {
          const response = await fetch("http://localhost:3001/stm32/record", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              state: "pause",
            }),
            credentials: "include",
          });

          if (response.ok) {
            console.log("Recording paused successfully.");
          } else {
            console.error("Failed to pause recording.");
          }
        } catch (error) {
          console.error("An error occurred:", error);
        }
      }
    };

    stopRecording();
  }, [stm32Data?.AutoState, stm32Data?.Mode]);

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
        rated_pain: painScale,
        user_id: user.user_id,
      };
      const fetchData = async () => {
        try {
          const exerciseData = await fetch(
            `http://localhost:3001/stm32/rated_pain`,
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

  useEffect(() => {
    if (
      stm32Data &&
      stm32Data.Positions &&
      stm32Data.Torques &&
      stm32Data.Current
    ) {
      if (
        stm32Data &&
        stm32Data.Positions &&
        stm32Data.Torques &&
        stm32Data.Current
      ) {
        const currentTime = Date.now();
        setLatestMotorData({
          motor1: {
            x: currentTime,
            position: stm32Data.Positions[0] ?? 0,
            torque: stm32Data.Torques[0] ?? 0,
            current: stm32Data.Current[0] ?? 0,
          },
          motor2: {
            x: currentTime,
            position: stm32Data.Positions[1] ?? 0,
            torque: stm32Data.Torques[1] ?? 0,
            current: stm32Data.Current[1] ?? 0,
          },
          motor3: {
            x: currentTime,
            position: stm32Data.Positions[2] ?? 0,
            torque: stm32Data.Torques[2] ?? 0,
            current: stm32Data.Current[2] ?? 0,
          },
        });
      }
    }
  }, [stm32Data]);

  const getChartData = () => ({
    datasets: [
      {
        data: [
          {
            x: latestMotorData.motor1.x,
            y: latestMotorData.motor1[graphDataType],
          },
        ],
      },
      {
        data: [
          {
            x: latestMotorData.motor2.x,
            y: latestMotorData.motor2[graphDataType],
          },
        ],
      },
      {
        data: [
          {
            x: latestMotorData.motor3.x,
            y: latestMotorData.motor3[graphDataType],
          },
        ],
      },
    ],
  });

  const exportCsv = async () => {
    try {
      if (!recordCsv) {
        // Clear previous data
        const response = await fetch("http://localhost:3001/stm32/clear-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (response.ok) {
          console.log("Data cleared successfully.");
          setRecordCsv(true);
        }
      } else {
        // Fetch saved STM32 data locally
        const response = await fetch("http://localhost:3001/stm32/saved-data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const responseData = await response.json();
          const stm32Data = responseData.data;

          generateAndDownloadCsv(stm32Data);

          setRecordCsv(false);
        } else {
          console.error("Error fetching saved STM32 data.");
        }
      }
    } catch (error) {
      console.error("Error during CSV export:", error);
    }
  };

  const generateAndDownloadCsv = (stm32Data: any) => {
    let csvContent = "I,Dor_A,Dor_T,Dor_S,Ev_A,Ev_T,Eve_S,Ext_A,Ext_T,Ext_S\n";

    const dataLength = stm32Data.angles.dorsiflexion.length;

    for (let i = 0; i < dataLength; i++) {
      const rowData = `${i + 1},${stm32Data.angles.dorsiflexion[i]},${stm32Data.torques.dorsiflexion[i]},${stm32Data.speeds.dorsiflexion[i]},${stm32Data.angles.eversion[i]},${stm32Data.torques.eversion[i]},${stm32Data.speeds.eversion[i]},${stm32Data.angles.extension[i]},${stm32Data.torques.extension[i]},${stm32Data.speeds.extension[i]}\n`;
      csvContent += rowData;
    }

    // Create a CSV file and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;

    const date = new Date();
    const fileName =
      (date.getMonth() + 1).toString().padStart(2, "0") + // Month (MM)
      date.getDate().toString().padStart(2, "0") +
      "_" + // Day (DD)
      date.getHours().toString().padStart(2, "0") +
      "h" + // Hour (HH)
      date.getMinutes().toString().padStart(2, "0") + // Minute (MM)
      ".csv";
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)",
        overflow: "auto",
      }}
    >
      <Box>
        <Grid
          container
          spacing={2}
          sx={{ justifyContent: "center", alignItems: "stretch" }}
        >
          <Grid item xs={12}>
            <Box
              gap={4}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 1,
              }}
            >
              {stm32Data?.AutoState == "Ready" ? (
                <HmiButtonClick
                  mainColor="#2fb73d"
                  hoverColor="#33a63f"
                  mode="Auto"
                  action="Control"
                  content="Start"
                  disabled={
                    !stm32Data ||
                    stm32Data?.AutoState !== "Ready" ||
                    stm32Data?.ErrorCode !== "0"
                  }
                  icon={<PlayArrow />}
                  socket={socket}
                />
              ) : (
                <HmiButtonClick
                  mainColor="#f5d50b"
                  hoverColor="#dcc21d"
                  mode="Auto"
                  action="Control"
                  content="Pause"
                  disabled={
                    !stm32Data ||
                    stm32Data?.AutoState === "WaitingForPlan" ||
                    stm32Data?.ErrorCode !== "0"
                  }
                  icon={<Pause />}
                  socket={socket}
                />
              )}
              <HmiButtonClick
                icon={<Stop />}
                mode="Auto"
                action="Control"
                content="Stop"
                mainColor="#e41b1b"
                hoverColor="#cb2626"
                disabled={
                  !stm32Data ||
                  stm32Data?.AutoState === "Ready" ||
                  stm32Data?.AutoState === "WaitingForPlan" ||
                  stm32Data?.ErrorCode !== "0"
                }
                socket={socket}
              />
              <HmiButtonClick
                mainColor="#1ec6e1"
                hoverColor="#2aa6ba"
                icon={<Home />}
                disabled={
                  !stm32Data ||
                  stm32Data?.AutoState !== "WaitingForPlan" ||
                  stm32Data?.ErrorCode !== "0"
                }
                mode="Homing"
                socket={socket}
              />
              <HmiButtonClick
                mainColor="#f1910f"
                hoverColor="#d08622"
                icon={<Refresh />}
                disabled={!stm32Data || stm32Data?.ErrorCode === "0"}
                mode="Reset"
                socket={socket}
              />

              <IconButton
                onClick={(e) => {
                  exportCsv();
                }}
                onTouchStart={(e) => {
                  exportCsv();
                }}
                size="large"
                sx={{
                  backgroundColor: "blueAccent.main",
                  "&:hover": {
                    backgroundColor: "blueAccent.hover",
                  },
                }}
                disabled={
                  !stm32Data ||
                  stm32Data?.AutoState == "WaitingForPlan" ||
                  stm32Data?.ErrorCode !== "0"
                }
              >
                {recordCsv ? (
                  <RadioButtonUncheckedIcon />
                ) : (
                  <RadioButtonCheckedIcon />
                )}
              </IconButton>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={graphDataType === "position"}
                    onChange={() => setGraphDataType("position")}
                  />
                }
                label="Position"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={graphDataType === "torque"}
                    onChange={() => setGraphDataType("torque")}
                  />
                }
                label="Torque"
              />
            </Box>
            <Grid
              container
              spacing={2}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 2,
              }}
            >
              <Grid
                item
                xs={12}
                sm={10}
                md={8}
                sx={{ gridRow: "span 2", height: "100%" }}
              >
                <LineChart
                  chartData={getChartData()}
                  type="realtime"
                  title="Motor Data"
                />
              </Grid>
              <Grid xs={4} item>
                <Paper
                  sx={{
                    padding: "10px",
                    backgroundColor: "white",
                    marginBottom: 1,
                  }}
                >
                  <ProgressionWidget
                    setOpenDialogPainScale={setOpenDialogPainScale}
                    stm32Data={stm32Data}
                    planData={planData}
                  />
                </Paper>
                <Paper sx={{ backgroundColor: "white" }}>
                  <ExerciseOverviewWidget
                    stm32Data={stm32Data}
                    planData={planData}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <RatingPopUp
        setOpenDialogPainScale={setOpenDialogPainScale}
        setPainScale={setPainScale}
        openDialogPainScale={openDialogPainScale}
      />
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 50,
          height: "100%",
          alignContent: "end",
        }}
      >
        <ManualControl
          stm32Data={stm32Data}
          errorFromStm32={stm32Data?.ErrorCode ?? null}
          socket={socket}
        />
      </Box>
    </Box>
  );
}
