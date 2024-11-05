import React, { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import StreamingPlugin from "chartjs-plugin-streaming";
import type {
  ChartData,
  ChartOptions,
  ScatterDataPoint,
  ChartDataset,
} from "chart.js";

Chart.register(CategoryScale);
Chart.register(StreamingPlugin);

interface LineChartProps {
  chartData: ChartData<"line">;
  type: string;
  title: string;
  graphPause?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  chartData,
  type,
  title,
  graphPause,
}) => {
  const chartRef = useRef<Chart<"line"> | null>(null);

  const getYAxisLimits = (
    datasets: ChartDataset<"line", (number | ScatterDataPoint | null)[]>[],
  ) => {
    let min = -65;
    let max = 65;

    datasets.forEach((dataset) => {
      dataset.data.forEach((point) => {
        if (typeof point === "object" && point?.y !== undefined) {
          min = Math.min(min, point.y);
          max = Math.max(max, point.y);
        }
      });
    });

    return { min, max };
  };

  const [chartOptions, setChartOptions] = React.useState<ChartOptions<"line">>(
    () => {
      if (type === "realtime") {
        const datasets: ChartDataset<
          "line",
          (number | ScatterDataPoint | null)[]
        >[] = [
          {
            label: "Motor Dorsiflexion",
            borderColor: "rgb(255, 99, 132)",
            data: [],
          },
          {
            label: "Motor Eversion",
            borderColor: "rgb(99, 255, 132)",
            data: [],
          },
          {
            label: "Motor Extension",
            borderColor: "rgb(99, 132, 255)",
            data: [],
          },
        ];
        return {
          datasets: datasets,
          scales: {
            x: {
              type: "realtime",
              ticks: {
                display: false,
              },
              realtime: {
                refresh: 100,
                duration: 5000,
                pause: graphPause,
                onRefresh: (chart: any) => {
                  if (!graphPause) {
                    chart.data.datasets.forEach(
                      (
                        dataset: ChartDataset<
                          "line",
                          (number | ScatterDataPoint | null)[]
                        >,
                        index: number,
                      ) => {
                        const xValue = chartData.datasets[index]?.data[
                          chartData.datasets[index]?.data.length - 1
                        ] as ScatterDataPoint;
                        const yValue = chartData.datasets[index]?.data[
                          chartData.datasets[index]?.data.length - 1
                        ] as ScatterDataPoint;

                        dataset.data.push({
                          x: xValue ? xValue.x : 0,
                          y: yValue ? yValue.y : 0,
                        });
                      },
                    );
                  }
                },
              },
            },
            y: getYAxisLimits(
              chartData.datasets as ChartDataset<
                "line",
                (number | ScatterDataPoint | null)[]
              >[],
            ),
          },
          pointRadius: 2,
          pointHoverRadius: 7,
        } as Partial<ChartOptions<"line">>;
      } else if (type === "activity") {
        return {
          scales: {
            x: {
              type: "category",
              display: false,
              title: {
                display: true,
              },
            },
            y: {
              title: {
                text: title,
                display: true,
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const dataPoint = context.raw as ScatterDataPoint;
                  const label = context.dataset.label || "";
                  const value = context.formattedValue;
                  const recordedDate = (dataPoint as any)?.recorded_date || "N/A";

                  return `${label}: ${value}\nRecorded Date: ${recordedDate}`;
                },
              },
            },
          },
        } as Partial<ChartOptions<"line">>;
      } else {
        return {} as Partial<ChartOptions<"line">>;
      }
    },
  );

  useEffect(() => {
    if (type === "realtime") {
      setChartOptions((prevOptions: ChartOptions<"line">) => ({
        ...prevOptions,
        scales: {
          x: {
            ...prevOptions.scales?.['x'],
            realtime: {
              ...(prevOptions?.scales?.["x"] as any)?.realtime,
              pause: graphPause,
              onRefresh: (chart: any) => {
                if (!graphPause) {
                  chart.data.datasets.forEach(
                    (
                      dataset: ChartDataset<
                        "line",
                        (number | ScatterDataPoint | null)[]
                      >,
                      index: number,
                    ) => {
                      const xValue = chartData.datasets[index]?.data[
                        chartData.datasets[index]?.data.length - 1
                      ] as ScatterDataPoint;
                      const yValue = chartData.datasets[index]?.data[
                        chartData.datasets[index]?.data.length - 1
                      ] as ScatterDataPoint;

                      dataset.data.push({
                        x: xValue ? xValue.x : 0,
                        y: yValue ? yValue.y : 0,
                      });
                    },
                  );
                }
              },
            },
          },
          y: {
            ...prevOptions.scales?.["y"],
            ...getYAxisLimits(
              chartData.datasets as ChartDataset<
                "line",
                (number | ScatterDataPoint | null)[]
              >[],
            ),
          },
        },
      }));
    }
  }, [chartData, graphPause]);

  useEffect(() => {
    setChartOptions((prevOptions: ChartOptions<"line">) => ({
      ...prevOptions,
      scales: {
        ...prevOptions.scales,
        y: {
          ...prevOptions.scales?.["y"],
          title: {
            display: true,
            text: title,
          },
        },
      },
    }));
  }, [title]);

  return (
    <div className="graph-container">
      <div className="bg-white rounded-lg">
        <Line
          ref={chartRef}
          data={
            type === "realtime"
              ? { datasets: chartOptions.datasets as ChartDataset<"line", (number | ScatterDataPoint | null)[]>[] }
              : chartData
          }
          options={chartOptions}
        />
      </div>
    </div>
  );
};

export default LineChart;
