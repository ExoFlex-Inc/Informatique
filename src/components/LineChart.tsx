import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import PauseButton from "../components/PauseButton.tsx";
import PlayButton from "../components/PlayButton.tsx";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import StreamingPlugin from "chartjs-plugin-streaming";
import { Socket } from "socket.io-client";

Chart.register(CategoryScale);
Chart.register(StreamingPlugin);

interface LineChartProps {
  chartData: {
    datasets: {
      label: string;
      borderColor: string;
      data: number[];
    }[];
  };
  mode?: string;
  type: string;
  socket: Socket | null;
}

interface RealtimeOptions {
  refresh: number;
  duration: number;
  delay: number;
  pause: boolean;
  onRefresh: (chart: Chart) => void;
}

interface XAxisOptions {
  type: string;
  ticks: {
    display: boolean;
  };
  title?: {
    display: boolean;
    text: string;
  };
  realtime: RealtimeOptions;
}

interface YAxisOptions {
  min: number;
  max: number;
}

interface ScalesOptions {
  x: XAxisOptions;
  y: YAxisOptions;
}

interface ChartOptions {
  scales: ScalesOptions;
}

interface Dataset {
  data: {
    x: number;
    y: number | undefined;
  }[];
}

const LineChart: React.FC<LineChartProps> = ({
  chartData,
  mode,
  socket,
  type,
}) => {
  const [graphPause, setGraphPause] = useState(false);
  const [graphDataIsPosition, setGraphDataIsPosition] = useState(true);
  const [chartOptions, setChartOptions] = useState<ChartOptions>(() => {
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
              onRefresh: (chart) => {
                chart.data.datasets.forEach(
                  (dataset: Dataset, index: number) => {
                    dataset.data.push({
                      x: Date.now(),
                      y: 0,
                    });
                  },
                );
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
    } else {
      return {};
    }
  });

  useEffect(() => {
    if (type === "realtime") {
      if (!socket) return;

      socket.on("stm32Data", (message) => {
        setChartOptions((prevOptions) => ({
          ...prevOptions,
          scales: {
            x: {
              ...prevOptions.scales.x,
              realtime: {
                ...prevOptions.scales.x.realtime,
                onRefresh: (chart) => {
                  chart.data.datasets.forEach(
                    (dataset: Dataset, index: number) => {
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
    setChartOptions((prevOptions) => ({
      ...prevOptions,
      scales: {
        x: {
          ...prevOptions.scales.x,
          realtime: {
            ...prevOptions.scales.x.realtime,
            pause: graphPause,
          },
        },
        y: {
          ...prevOptions.scales.y,
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
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};
export default LineChart;
