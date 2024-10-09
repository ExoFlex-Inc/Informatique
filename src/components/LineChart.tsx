import React, { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
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
  removeFirstPoint: () => void;
  graphPause: boolean;
}

interface Dataset {
  data: {
    x: number;
    y: number | undefined;
  }[];
}

const LineChart: React.FC<LineChartProps> = ({
  chartData,
  socket,
  type,
  title,
  setChartImage,
  graphPause, // Receive graphPause as a prop
}) => {
  const chartRef = useRef<Chart<"line"> | null>(null);

  const getYAxisLimits = (datasets: Dataset[]) => {
    let min = -65;
    let max = 65; // Default max is 65

    datasets.forEach((dataset) => {
      dataset.data.forEach((point) => {
        if (point.y !== undefined) {
          min = Math.min(min, point.y);
          max = Math.max(max, point.y);
        }
      });
    });

    return { min, max };
  };

  const [chartOptions, setChartOptions] = React.useState<
    _DeepPartialObject<ChartJsOptions<"line">>
  >(() => {
    if (type === "realtime") {
      return {
        scales: {
          x: {
            type: "realtime",
            ticks: {
              display: false,
            },
            realtime: {
              // refresh: 2000,
              delay: 1000,
              duration: 5000,
              pause: graphPause,
              onRefresh: (chart: any) => {
                if (!graphPause) {
                  // Only update if not paused
                  chart.data.datasets.forEach(
                    (dataset: Dataset, index: number) => {
                      const yValue =
                        chartData.datasets[index]?.data[
                          chartData.datasets[index]?.data.length - 1
                        ]?.y;

                      dataset.data.push({
                        x: Date.now(),
                        y: yValue !== undefined ? yValue : 0,
                      });
                    },
                  );
                }
              },
            },
          },
          y: getYAxisLimits(chartData.datasets as Dataset[]),
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
      setChartOptions((prevOptions: any) => ({
        ...prevOptions,
        scales: {
          x: {
            ...prevOptions.scales?.x,
            realtime: {
              ...prevOptions?.scales?.x?.realtime,
              pause: graphPause,
              onRefresh: (chart: any) => {
                if (!graphPause) {
                  // Only update if not paused
                  chart.data.datasets.forEach(
                    (dataset: Dataset, index: number) => {
                      const yValue =
                        chartData.datasets[index]?.data[
                          chartData.datasets[index]?.data.length - 1
                        ]?.y;

                      dataset.data.push({
                        x: Date.now(),
                        y: yValue !== undefined ? yValue : 0,
                      });
                    },
                  );
                }
              },
            },
          },
          y: {
            ...prevOptions.scales?.y,
            ...getYAxisLimits(chartData.datasets as Dataset[]),
          },
        },
      }));
    }
  }, [socket?.connected, chartData, graphPause]);

  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = chartRef.current;
      const chartImage = chartInstance.toBase64Image();
      setChartImage?.(chartImage);
    }
  }, [chartData, chartOptions, setChartImage]);

  return (
    <div className="graph-container">
      <div className="bg-white rounded-lg">
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default LineChart;
