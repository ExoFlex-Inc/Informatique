import LineChart from "../components/LineChart.tsx";
import AirlineSeatLegroomExtraIcon from "@mui/icons-material/AirlineSeatLegroomExtra";
import MotorControlWidget from "../components/MotorControlWidget.tsx";
import useStm32 from "../hooks/use-stm32.ts";
import CustomScrollbar from "../components/CustomScrollbars.tsx";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (stm32Data?.ErrorCode !== undefined) {
      const errorNames = decodeErrorCode(stm32Data.ErrorCode);
      setErrorDescription(errorNames.join(", ") || "");
    }
  }, [stm32Data?.ErrorCode]);

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

  const manualData = {
    datasets: [
      {
        label: "Motor 1",
        borderColor: "rgb(255, 99, 132)",
        data: [],
      },
      {
        label: "Motor 2",
        borderColor: "rgb(99, 255, 132)",
        data: [],
      },
      {
        label: "Motor 3",
        borderColor: "rgb(99, 132, 255)",
        data: [],
      },
    ],
  };

  return (
    <div className="flex flex-col custom-height overflow-auto">
      <CustomScrollbar>
        <div className="justify-center flex mb-10">
          <LineChart
            chartData={manualData}
            mode="Manual"
            type="realtime"
            socket={socket}
          />
        </div>

        <div className="flex justify-center h-80 mb-4 gap-4">
          <MotorControlWidget
            title={"Anatomical Movement"}
            icon={<AirlineSeatLegroomExtraIcon sx={{ fontSize: "56px" }} />}
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

          <textarea
            value={errorDescription}
            readOnly
            rows={6}
            cols={30}
            className="border border-gray-300 p-2 rounded text-black"
          />
        </div>
      </CustomScrollbar>
    </div>
  );
}
