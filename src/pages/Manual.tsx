import LineChart from "../components/LineChart.tsx";
import AirlineSeatLegroomExtraIcon from "@mui/icons-material/AirlineSeatLegroomExtra";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import MotorControlWidget from "../components/MotorControlWidget.tsx";
import useStm32 from "../hooks/use-stm32.ts";
import { useMediaQuery } from "@mui/material";
import CustomScrollbar from "../components/CustomScrollbars.tsx";

export default function Manual() {
  const { socket, errorFromStm32 } = useStm32();

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
        <div className="flex justify-center h-80 mb-4">
          <MotorControlWidget
            title={"Motor Control"}
            icon={<ComputerRoundedIcon sx={{ fontSize: "56px" }} />}
            labels={[
              "Motor1H",
              "Motor1AH",
              "Motor2H",
              "Motor2AH",
              "Motor3H",
              "Motor3AH",
            ]}
            mode="Manual"
            action="Increment"
            disabled={errorFromStm32}
          />

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

          <MotorControlWidget
            title={"Home Settings"}
            icon={<HomeOutlinedIcon sx={{ fontSize: "56px" }} />}
            labels={["GoHome1", "GoHome2", "GoHome3", "GoHome", "SetHome"]}
            mode="Manual"
            action="Homing"
            disabled={errorFromStm32}
          />
        </div>
      </CustomScrollbar>
    </div>
  );
}
