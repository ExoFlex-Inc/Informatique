import { useEffect, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  Paper,
} from "@mui/material";
import { Refresh, PlayArrow, Pause, Home } from "@mui/icons-material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LineChart from "../components/LineChart";
import useStm32 from "../hooks/use-stm32.ts";
import Button from "../components/Button.tsx";
import ManualControl from "../components/ManualControl.tsx";
import HmiButtonClick from "../components/HmiButtonClick.tsx";
import stm32errors from "../assets/stm32errors.json";

type errorInfo = {
  errorNames: string;
  errorDescription: string;
};

const errorMap = {
  0: "ERROR_0_MSEC",
  1: "ERROR_1_MHMI",
  2: "ERROR_2_MMOT",
  3: "ERROR_3_MMOV",
  4: "ERROR_4_LS_EXT_UP",
  5: "ERROR_5_LS_EXT_DOWN",
  6: "ERROR_6_LS_LEFT",
  7: "ERROR_7_LS_RIGHT",
  8: "ERROR_8_LS_EVER_LEFT",
  9: "ERROR_9_LS_EVER_RIGHT",
  10: "ERROR_10_LS_DORS_UP",
  11: "ERROR_11_LS_DORS_DOWN",
  12: "ERROR_12_CYCLESMS",
  13: "ERROR_13_MAX_TEMPERATURE",
  14: "ERROR_14_MMOT_CAN_CONNECT",
  15: "ERROR_15_MMOT_CAN_MAX_DELAY",
  16: "ERROR_16_MMOT_SET_ORIGIN",
  17: "ERROR_17_MOTOR_1",
  18: "ERROR_18_MOTOR_2",
  19: "ERROR_19_MOTOR_3",
  20: "ERROR_20_MMOT_MINMAX_POS",
  21: "ERROR_21_MMOT_MINMAX_TORQUE",
  22: "ERROR_22_MMOT_MINMAX_SPEED",
  23: "ERROR_23",
  24: "ERROR_24",
  25: "ERROR_25",
};
export default function Manual() {
  const [errorInformation, setErrorInformation] = useState<errorInfo[]>([]);
  const [graphDataType, setGraphDataType] = useState("position");
  const [graphPause, setGraphPause] = useState(false);
  const { stm32Data, socket } = useStm32();

  const [latestMotorData, setLatestMotorData] = useState({
    motor1: { x: 0, position: 0, torque: 0, current: 0 },
    motor2: { x: 0, position: 0, torque: 0, current: 0 },
    motor3: { x: 0, position: 0, torque: 0, current: 0 },
  });
  const [recordCsv, setRecordCsv] = useState(false);

  const decodeErrorCode = (errorCode: number) => {
    const errorNames = [];
    for (let i = 0; i < 32; i++) {
      if (errorCode & (1 << i)) {
        if (errorMap[i as keyof typeof errorMap]) {
          errorNames.push(errorMap[i as keyof typeof errorMap]);
        }
      }
    }
    return errorNames;
  };

  useEffect(() => {
    if (
      stm32Data &&
      stm32Data.Positions &&
      stm32Data.Torques &&
      stm32Data.Current &&
      !graphPause
    ) {
      if (
        stm32Data &&
        stm32Data.Positions &&
        stm32Data.Torques &&
        stm32Data.Current &&
        !graphPause
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
    if (stm32Data?.ErrorCode !== undefined) {
      const errorNames = decodeErrorCode(stm32Data.ErrorCode);
      const errorInformation = errorNames.map((el: string, index) => {
        return {
          errorNames: errorNames[index],
          errorDescription: stm32errors[el as keyof typeof stm32errors],
        };
      });
      setErrorInformation(errorInformation);
    }
  }, [stm32Data, graphPause]);

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
    <div className="custom-height flex flex-col overflow-x-auto">
      <Box>
        <Grid
          container
          paddingX={12}
          spacing={2}
          sx={{ justifyContent: "center", alignItems: "center" }}
        >
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ width: 50 }} />
              <Box gap={4} sx={{ display: "flex", paddingRight: 4 }}>
                <IconButton
                  onClick={() => setGraphPause(false)}
                  disabled={!graphPause}
                  size="large"
                  sx={{
                    backgroundColor: "#2fb73d",
                    "&:hover": { backgroundColor: "#33a63f" },
                  }}
                >
                  <PlayArrow />
                </IconButton>
                <IconButton
                  onClick={() => setGraphPause(true)}
                  disabled={graphPause}
                  size="large"
                  sx={{
                    backgroundColor: "#f5d50b",
                    "&:hover": { backgroundColor: "#dcc21d" },
                  }}
                >
                  <Pause />
                </IconButton>
                <HmiButtonClick
                  icon={<Home />}
                  mode="Homing"
                  mainColor="blueAccent.main"
                  hoverColor="blueAccent.hover"
                  socket={socket}
                />

                <HmiButtonClick
                  icon={<Refresh />}
                  disabled={!stm32Data?.ErrorCode}
                  mode="Reset"
                  mainColor="blueAccent.main"
                  hoverColor="blueAccent.hover"
                  socket={socket}
                />
                <IconButton
                  onClick={(e) => {
                    exportCsv();
                  }}
                  size="large"
                  sx={{
                    backgroundColor: "blueAccent.main",
                    "&:hover": {
                      backgroundColor: "blueAccent.hover",
                    },
                  }}
                  disabled={!stm32Data?.ErrorCode}
                >
                  {recordCsv ? (
                    <RadioButtonUncheckedIcon />
                  ) : (
                    <RadioButtonCheckedIcon />
                  )}
                </IconButton>
              </Box>
              <Box sx={{ width: 50 }} />
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={graphDataType === "current"}
                    onChange={() => setGraphDataType("current")}
                  />
                }
                label="Current"
              />
            </Box>
            <LineChart
              chartData={getChartData()}
              type="realtime"
              title="Motor Data"
              graphPause={graphPause}
            />
          </Grid>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: "12px",
                  bgcolor: "white",
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell>
                        <Typography align="center" sx={{ color: "gray" }}>
                          Error code
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography align="center" sx={{ color: "gray" }}>
                          Description
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {errorInformation.map((el, index) => {
                      return (
                        <TableRow>
                          <TableCell>
                            <Typography align="center" sx={{ color: "gray" }}>
                              {errorInformation?.[index]?.errorNames}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography align="center" sx={{ color: "gray" }}>
                              {errorInformation?.[index]?.errorDescription}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
        </Grid>
      </Box>
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
          socket={socket}
          errorFromStm32={stm32Data?.ErrorCode ?? null}
        />
      </Box>
    </div>
  );
}
