import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import PauseButton from "../components/PauseButton.tsx";
import PlayButton from "../components/PlayButton.tsx";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import StreamingPlugin from "chartjs-plugin-streaming";
import { Socket } from "socket.io-client";
import { _DeepPartialObject } from "chart.js/types/utils";
import { ChartData, ChartOptions as ChartJsOptions } from "chart.js";

Chart.register(CategoryScale);
Chart.register(StreamingPlugin);

interface LineChartProps {
  chartData: ChartData<"line">;
  mode?: string;
  type: string;
  socket?: Socket | null;
  title?: string;
}
interface Dataset {
  data: {
    x: number;
    y: number | undefined;
  }[];
  socket?: Socket | null;
}

const LineChart: React.FC<LineChartProps> = ({
  chartData,
  mode,
  socket,
  type,
  title,
}) => {
  const [graphPause, setGraphPause] = useState(false);
  const [graphDataIsPosition, setGraphDataIsPosition] = useState(true);

  const [chartOptions, setChartOptions] = useState<
    _DeepPartialObject<ChartJsOptions<"line">>
  >(() => {
    if (type === "realtime") {
      return {
        scales: {
          x: {
            type: type,
            ticks: {
              display: false,
            },
            realtime: {
              refresh: 100,
              delay: 20,
              duration: 2000,
              pause: false,
              onRefresh: (chart: any) => {
                chart.data.datasets.forEach((dataset: Dataset) => {
                  dataset.data.push({
                    x: Date.now(),
                    y: 0,
                  });
                });
              },
            },
          },
          y: {
            min: 0,
            max: graphDataIsPosition ? 180 : 48,
          },
        },
      };
    } else if (type === "line") {
      return {
        scales: {
          x: {
            type: "linear",
            min: 0,
            max: 10,
            border: {
              color: "red",
            },
          },
          y: {
            min: -65,
            max: 65,
          },
        },
      };
    } else if (type === "activity") {
      return {
        scales: {
          x: {
            title: {
              text: "Date",
              display: true,
            },
            type: "time",

            time: {
              unit: "day",
            },
          },
          y: {
            title: {
              text: title,
              display: true,
            },
          },
        },
      };
    } else {
      return {};
    }
  });

  useEffect(() => {
    if (type === "realtime" && socket) {
      socket.on("stm32Data", (message) => {
        setChartOptions((prevOptions: any) => ({
          ...prevOptions,
          scales: {
            x: {
              ...prevOptions.scales?.x,
              realtime: {
                ...prevOptions?.scales?.x?.realtime,
                onRefresh: (chart: any) => {
                  chart.data.datasets.forEach(
                    (
                      dataset: { data: { x: number; y: number | undefined }[] },
                      index: number,
                    ) => {
                      dataset.data.push({
                        x: Date.now(),
                        y: graphDataIsPosition
                          ? message.Positions[index]
                          : message.Torques[index],
                      });
                    },
                  );
                },
              },
            },
            y: {
              min: graphDataIsPosition ? -65 : 0,
              max: graphDataIsPosition ? 65 : 48,
            },
          },
        }));
      });

      return () => {
        socket.off("stm32Data");
      };
    }
  }, [socket?.connected, graphDataIsPosition]);

  useEffect(() => {
    setChartOptions((prevOptions: any) => ({
      ...prevOptions,
      scales: {
        x: {
          ...prevOptions.scales?.x,
        },
        y: {
          ...prevOptions.scales?.y,
          title: {
            ...prevOptions.scales?.y.title,
            text: title,
          },
        },
      },
    }));
  }, [title]);

  useEffect(() => {
    setChartOptions((prevOptions: any) => ({
      ...prevOptions,
      scales: {
        x: {
          ...prevOptions.scales?.x,
          realtime: {
            ...prevOptions?.scales?.x?.realtime,
            pause: graphPause,
          },
        },
        y: {
          ...prevOptions.scales?.y,
        },
      },
    }));
  }, [graphPause]);

  return (
    <div className="graph-container">
      <div className="grid grid-cols-4">
        {type === "realtime" && (
          <div className="flex">
            <PlayButton setGraphPause={setGraphPause} graphPause={graphPause} />
            <PauseButton
              setGraphPause={setGraphPause}
              graphPause={graphPause}
            />
          </div>
        )}
        {mode === "Manual" && (
          <div className="flex col-span-2 justify-center">
            <div className="flex mr-4">
              <label>Position</label>
              <input
                type="checkbox"
                checked={graphDataIsPosition}
                onChange={() => {
                  setGraphDataIsPosition(!graphDataIsPosition);
                }}
              />
            </div>
            <div className="flex">
              <label>Torque</label>
              <input
                type="checkbox"
                checked={!graphDataIsPosition}
                onChange={() => {
                  setGraphDataIsPosition(!graphDataIsPosition);
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default LineChart;
