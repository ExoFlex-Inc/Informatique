import React from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-luxon";
// import { ChartData } from "react-chartjs-2"
import Chart from "chart.js/auto";
import {CategoryScale, Ticks} from 'chart.js';
import StreamingPlugin from "chartjs-plugin-streaming";
Chart.register(CategoryScale);
Chart.register(StreamingPlugin);

interface LineChartProps {
  chartData: {
    datasets: {
      label: string;
      backgroundColor: string;
      borderColor: string;
      borderDash: number[];
      fill: boolean;
      data: number[];
    }[];
  };
}

interface RealtimeOptions {
  delay: number;
  onRefresh: (chart: Chart) => void;
}

interface XAxisOptions {
  type: 'realtime';
  realtime: RealtimeOptions;
}

interface ScalesOptions {
  [key: string]: XAxisOptions;
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

const LineChartOptions: ChartOptions = {
    scales: {
        x: {
            type: 'realtime',
            realtime: {
              delay: 2000,
              onRefresh: chart => {
                  chart.data.datasets.forEach((dataset: Dataset) => {
                    dataset.data.push({
                      x: Date.now(),
                      y: Math.random()
                    })
                  });
              },
            },
        }
    },
}

const LineChart: React.FC<LineChartProps> = ({ chartData }) => {
  return <Line data={chartData} options={LineChartOptions}/>;
}

export default LineChart;