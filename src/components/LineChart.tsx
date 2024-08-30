import React, { useState, useEffect, useRef } from "react";
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
  setChartImage?: React.Dispatch<React.SetStateAction<string>>;
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
  setChartImage,
}) => {
  const [graphPause, setGraphPause] = useState(false);
  const [graphDataType, setGraphDataIsType] = useState('position');

  const chartRef = useRef<Chart<"line"> | null>(null);

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
            max: graphDataType == 'position' ? 180 : graphDataType == 'torque' ? 48 : 30,
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
                        y: graphDataType == 'position'
                          ? message.Positions[index]
                          : graphDataType == 'torque'
                          ? message.Torques[index]
                          : message.Current[index],
                      });
                    },
                  );
                },
              },
            },
            y: {
              min: graphDataType == 'position' ? -65 : graphDataType == 'torque' ? 0 : -30,
              max: graphDataType == 'position' ? 65 : graphDataType == 'torque' ? 48 : 30,
            },
          },
        }));
      });

      return () => {
        socket.off("stm32Data");
      };
    }
  }, [socket?.connected, graphDataType]);

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
    if (chartRef.current) {
      const chartInstance = chartRef.current;
      const chartImage = chartInstance.toBase64Image();
      setChartImage?.(chartImage);
    }
  }, [chartData, chartOptions, setChartImage]);

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
                checked={graphDataType == 'position'}
                onChange={() => {
                  setGraphDataIsType('position');
                }}
              />
            </div>
            <div className="flex mr-4">
              <label>Torque</label>
              <input
                type="checkbox"
                checked={graphDataType == 'torque'}
                onChange={() => {
                  setGraphDataIsType('torque');
                }}
              />
            </div>
            <div className="flex">
              <label>Current</label>
              <input
                type="checkbox"
                checked={graphDataType == 'current'}
                onChange={() => {
                  setGraphDataIsType('current');
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg">
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default LineChart;
