import React from "react";
import { Line } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";

interface LineChartProps {
  chartData: {
    labels: number[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string;
      borderWidth: number;
    }[];
  };
}

// const options: ChartOptions<"line"> = {
//   responsive: true,
//   scales: {
//     x: {
//       type: 'category'
//     },
//     y: {
//       type: 'category'
//     }
//   },
//   plugins: {
//     legend: {
//       position: 'top' as const,
//     },
//     title: {
//       display: true,
//       text: 'Chart.js Line Chart',
//     },
//   },
// };

const LineChart: React.FC<LineChartProps> = ({ chartData }) => {
  return <Line data={chartData} />;
}

export default LineChart;