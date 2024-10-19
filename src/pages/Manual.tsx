import { useEffect, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import AirlineSeatLegroomExtraIcon from "@mui/icons-material/AirlineSeatLegroomExtra";
import LineChart from "../components/LineChart";
import MotorControlWidget from "../components/MotorControlWidget";
import useStm32 from "../hooks/use-stm32";

const WhiteBorderCheckbox = styled(Checkbox)(() => ({
  color: "white",
  "&.Mui-checked": {
    color: "white",
  },
  "& .MuiSvgIcon-root": {
    fontSize: 28,
  },
  "& .MuiCheckbox-root": {
    border: "1px solid white",
  },
}));

const errorMap = {
  0: "ERROR_0_MSEC",
  1: "ERROR_1_MHMI",
  2: "ERROR_2_MMOT",
  3: "ERROR_3_MMOV",
  4: "ERROR_4_LS_EXT_UP",
  5: "ERROR_5_LS_EXT_DOWN",
  6: "ERROR_6_LS_LEFT",
  7: "ERROR_7_LS_RIGHT",
  8: "ERROR_8_LS_EVER_UP",
  9: "ERROR_9_LS_EVER_DOWN",
  10: "ERROR_10_LS_DORS_UP",
  11: "ERROR_11_LS_DORS_DOWN",
  12: "ERROR_12_CYCLESMS",
  13: "ERROR_13",
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
  const { stm32Data, socket, errorFromStm32 } = useStm32();
  const [errorDescription, setErrorDescription] = useState("");
  const [graphDataType, setGraphDataType] = useState("position");
  const [graphPause, setGraphPause] = useState(false);
  const [latestMotorData, setLatestMotorData] = useState({
    motor1: { x: 0, position: 0, torque: 0, current: 0 },
    motor2: { x: 0, position: 0, torque: 0, current: 0 },
    motor3: { x: 0, position: 0, torque: 0, current: 0 },
  });

  useEffect(() => {
    if (stm32Data?.ErrorCode !== undefined) {
      const errorNames = decodeErrorCode(stm32Data.ErrorCode);
      setErrorDescription(errorNames.join("\n") || "");
    }
  }, [stm32Data]);

  const decodeErrorCode = (errorCode) => {
    const errorNames = [];
    for (let i = 0; i < 32; i++) {
      if (errorCode & (1 << i)) {
        if (errorMap[i]) {
          errorNames.push(errorMap[i]);
        }
      }
    }
    return errorNames;
  };

  useEffect(() => {
    if (stm32Data && stm32Data.Positions && stm32Data.Torques && !graphPause) {
      const currentTime = Date.now();
      setLatestMotorData({
        motor1: {
          x: currentTime,
          position: stm32Data.Positions[0],
          torque: stm32Data.Torques[0],
          current: stm32Data.Current[0],
        },
        motor2: {
          x: currentTime,
          position: stm32Data.Positions[1],
          torque: stm32Data.Torques[1],
          current: stm32Data.Current[1],
        },
        motor3: {
          x: currentTime,
          position: stm32Data.Positions[2],
          torque: stm32Data.Torques[2],
          current: stm32Data.Current[2],
        },
      });
    }
  }, [stm32Data, socket, graphPause]);

  const getChartData = () => ({
    datasets: [
      {
        label: "Motor 1",
        borderColor: "rgb(255, 99, 132)",
        data: [
          {
            x: latestMotorData.motor1.x,
            y: latestMotorData.motor1[graphDataType],
          },
        ],
      },
      {
        label: "Motor 2",
        borderColor: "rgb(99, 255, 132)",
        data: [
          {
            x: latestMotorData.motor1.x,
            y: latestMotorData.motor2[graphDataType],
          },
        ],
      },
      {
        label: "Motor 3",
        borderColor: "rgb(99, 132, 255)",
        data: [
          {
            x: latestMotorData.motor1.x,
            y: latestMotorData.motor3[graphDataType],
          },
        ],
      },
    ],
  });

  return (
    <Box sx={{ height: "100vh", overflow: "auto" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 2,
            }}
          >
            <IconButton
              onClick={() => setGraphPause(false)}
              disabled={!graphPause}
            >
              <PlayArrowIcon />
            </IconButton>
            <IconButton
              onClick={() => setGraphPause(true)}
              disabled={graphPause}
            >
              <PauseIcon />
            </IconButton>
            <Box sx={{ width: 50 }} />
            <FormControlLabel
              control={
                <WhiteBorderCheckbox
                  checked={graphDataType === "position"}
                  onChange={() => setGraphDataType("position")}
                />
              }
              label="Position"
            />
            <FormControlLabel
              control={
                <WhiteBorderCheckbox
                  checked={graphDataType === "torque"}
                  onChange={() => setGraphDataType("torque")}
                />
              }
              label="Torque"
            />
            <FormControlLabel
              control={
                <WhiteBorderCheckbox
                  checked={graphDataType === "current"}
                  onChange={() => setGraphDataType("current")}
                />
              }
              label="Current"
            />
          </Box>
          <LineChart
            chartData={getChartData()}
            mode="Manual"
            type="realtime"
            graphPause={graphPause}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <MotorControlWidget
              title="Anatomical Movement"
              icon={<AirlineSeatLegroomExtraIcon sx={{ fontSize: 56 }} />}
              labels={[
                "EversionL",
                "EversionR",
                "DorsiflexionU",
                "DorsiflexionD",
                "ExtensionU",
                "ExtensionD",
              ]}
              mode="Manual"
              action="Increment"
              disabled={errorFromStm32}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <TextField
              value={errorDescription}
              multiline
              fullWidth
              rows={10}
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              sx={{ marginRight: 5 }}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
