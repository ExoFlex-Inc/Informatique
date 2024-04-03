import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
import PauseButton from "../components/PauseButton.tsx";
import PlayButton from "../components/PlayButton.tsx";
// import { ChartData } from "react-chartjs-2"
import Chart from "chart.js/auto";
import { CategoryScale, Ticks } from "chart.js";
import StreamingPlugin from "chartjs-plugin-streaming";

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
  setPositionGraph: React.Dispatch<React.SetStateAction<boolean>>;
  positionGraph: boolean;
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
    y: number;
  }[];
}

const LineChart: React.FC<LineChartProps> = ({
  chartData,
  setPositionGraph,
  positionGraph,
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
                chart.data.datasets.forEach((dataset: Dataset) => {
                  dataset.data.push({
                    x: Date.now(),
                    y: Math.random() * 30
                  })
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
            <input type="checkbox" checked={positionGraph} onClick={() => {setPositionGraph(!positionGraph)}}/>
          </div>
          <div className="flex">
            <text>Torque</text>
            <input type="checkbox" checked={!positionGraph} onClick={() => {setPositionGraph(!positionGraph)}}/>
          </div>
        </div>
      </div>
      <Line data={chartData} options={chartOptions}/>
    </div>
  );
};

export default LineChart;
