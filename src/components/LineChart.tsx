import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import PauseButton from "../components/PauseButton.tsx";
import PlayButton from "../components/PlayButton.tsx";
// import { ChartData } from "react-chartjs-2"
import Chart from "chart.js/auto";
import { CategoryScale, Ticks } from "chart.js";
import StreamingPlugin from "chartjs-plugin-streaming";
import useStm32 from "../hooks/use-stm32.ts";
import { Socket } from 'socket.io-client';

Chart.register(CategoryScale);
Chart.register(StreamingPlugin);

interface LineChartProps {
  chartData: {
    datasets: {
      label: string;
      borderColor: string;
      borderDash: number[];
      fill: boolean;
      data: number[];
    }[];
  };
  setGraphDataIsPosition: React.Dispatch<React.SetStateAction<boolean>>;
  graphDataIsPosition: boolean;
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
  type: 'realtime';
  ticks: {
    display: boolean;
  };
  realtime: RealtimeOptions;
}

interface YAxisOptions {
  min: number;
  max: number
}

interface ScalesOptions {
  x: XAxisOptions;
  y: YAxisOptions;
  // x: XAxisOptions;
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
  setGraphDataIsPosition,
  graphDataIsPosition,
  socket
}) => {
  const [graphPause, setGraphPause] = useState(false);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    scales: {
      x: {
          type: 'realtime',
          ticks: {
            display: false,
          },
          realtime: {
            refresh: 100,
            delay: 100,
            duration: 2000,
            pause: false,
            onRefresh: chart => {
              chart.data.datasets.forEach((dataset: Dataset, index: number) => {
                dataset.data.push({
                    x: Date.now(),
                    y: chartData.datasets[index].data[0]
                });
            });

          },
          
          },
      },
      y: {
        min: 0,
        max: 30
      }
    },
  });

  useEffect(() => {
    if (!socket) return; // Ensure socket is available

    // Set up event listener for "stm32Data" event
    socket.on("stm32Data", (message) => {
      setChartOptions(prevOptions => ({
        ...prevOptions,
        scales: {
          x: {
            ...prevOptions.scales.x,
            realtime: {
              ...prevOptions.scales.x.realtime,
              onRefresh: chart => {
                chart.data.datasets.forEach((dataset, index) => {
                  dataset.data.push({
                    x: Date.now(),
                    y: message.positions[index]
                  });
                });
              },
            },
          },
          y: {
            min: 0,
            max: 30
          }
        },
      }));
    });

    // Cleanup function to remove event listener when component unmounts
    return () => {
      socket.off("stm32Data");
    };
  }, [socket, chartData, graphDataIsPosition]);

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
          min: 0,
          max: 30
        }
      },
    }));
  }, [graphPause]);

  return(
    <div className="w-[450px]">

      <div className="grid grid-cols-4">
        <div className="flex">
          <PlayButton setGraphPause={setGraphPause} graphPause={graphPause} />
          <PauseButton setGraphPause={setGraphPause} graphPause={graphPause} />
        </div>
        <div className="flex col-span-2 justify-center">
          <div className="flex mr-4">
            <text>Position</text>
            <input type="checkbox" checked={graphDataIsPosition} onClick={() => {setGraphDataIsPosition(!graphDataIsPosition)}}/>
          </div>
          <div className="flex">
            <text>Torque</text>
            <input type="checkbox" checked={!graphDataIsPosition} onClick={() => {setGraphDataIsPosition(!graphDataIsPosition)}}/>
          </div>
        </div>
      </div>
      <Line data={chartData} options={chartOptions}/>
    </div>
  );
};

export default LineChart;