import React from "react";
import Chart from "chart.js/auto";
import moment from "moment";
import "chartjs-plugin-streaming";

interface RealtimeOptions {
  onRefresh: (chart: {chart: Chart}) => void;
  delay: number;
  time: {
      displayFormat: string;
  };
}

interface TickOptions {
  displayFormats: number;
  maxRotation: number;
  minRotation: number;
  stepSize: number;
  maxTicksLimit: number;
  minUnit: string;
  source: string;
  autoSkip: boolean;
  callback: (value: string) => string;
}

interface XAxis {
  type: "realtime";
  distribution: "linear";
  realtime: RealtimeOptions;
  ticks: TickOptions;
}

interface YAxis {
  ticks: {
      beginAtZero: boolean;
      max: number;
  };
}

interface ChartOptions {
  elements: {
      line: {
          tension: number;
      };
  };
  scales: {
      xAxes: XAxis[];
      yAxes: YAxis[];
  };
}

const LineChartOptions: ChartOptions = {
    elements: {
        line: {
            tension: 0.5
        }
    },
    scales: {
        xAxes: [
            {
                type: "realtime",
                distribution: "linear",
                realtime: {
                    onRefresh: function(chart: {chart: Chart}) {
                        chart.chart.data.datasets[0].data.push({
                            x: moment().valueOf(),
                            y: Math.random()
                        });
                    },
                    delay: 3000,
                    time: {
                        displayFormat: "h:mm"
                    }
                },
                ticks: {
                    displayFormats: 1,
                    maxRotation: 0,
                    minRotation: 0,
                    stepSize: 1,
                    maxTicksLimit: 30,
                    minUnit: "second",
                    source: "auto",
                    autoSkip: true,
                    callback: function(value: string) {
                        return moment(value, "HH:mm:ss").format("mm:ss");
                    }
                }
            }
        ],
        yAxes: [
            {
                ticks: {
                    beginAtZero: true,
                    max: 1,
                }
            }
        ],
    },
}

export default LineChartOptions;