import UserSearchBar from "../components/UserSearchBar.tsx";
import { useEffect, useState } from "react";
import LineChart from "../components/LineChart.tsx";
import { FilterAlt } from "@mui/icons-material";
import GraphFilters from "../components/GraphFilters.tsx";
import { DateRangePicker } from "rsuite";
import "rsuite/DateRangePicker/styles/index.css";
import { ChartData } from "chart.js";
import {
  Button,
  Box,
  ThemeProvider,
  createTheme,
  Paper,
  Typography,
} from "@mui/material";
import CustomScrollbar from "../components/CustomScrollbars.tsx";
import { useRelations } from "../hooks/use-relations.ts";
import Loading from "../components/Loading.tsx";

export interface dataStructure {
  angle_max: number;
  angle_target: number;
  date: Date;
  force_avg: number;
  force_max: number;
  id: string;
  repetitions_done: number;
  user_id: string;
  repetitions_success_rate: number;
  predicted_total_time: number;
  actual_total_time: number;
  rated_pain: number;
}
interface AngleMaxAverages {
  dorsiflexion: number;
  eversion: number;
  extension: number;
}

function onGraphTypeChange(
  show_points: boolean,
  labels: string[],
  titles: string[],
  colors: string[],
  dates: string[],
  ...args: number[][][]
) {
  const mappedArgs = args.map((arg: number[][], index: number) => {
    const dataPoints = [];
    let cumulativeIndex = 0;

    for (let index = 0; index < arg.length;index++) {
      const value = arg[index];
      const date = dates[index];

      for (let i = 0; i < value.length; i++) {
        dataPoints.push({
          x: cumulativeIndex + 1,
          y: value[i],
          recorded_date: date,
        });
        cumulativeIndex++;
      }
    }

    if (show_points) {
      return {
        label: labels[index],
        data: dataPoints,
        borderColor: colors[index],
        fill: false,
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7,
      };
    } else {
      return {
        label: labels[index],
        data: dataPoints,
        borderColor: colors[index],
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 7,
      };
    }
  });
  // Update x-axis labels based on the cumulative data points
  const xAxisLabels = mappedArgs[0].data.map((point) => point.x);

  return {
    chartData: {
      labels: xAxisLabels,
      datasets: mappedArgs,
    },
    title: titles[0],
  };
}


export default function Activity() {
  const [selectedUser, setSelectedUser] = useState<any[]>([]);
  const [isGraphFilterOpen, setIsGraphFilterOpen] = useState(false);
  const [graphType, setGraphType] = useState("");
  const [date, setDate] = useState<DateRange | null>();
  const [data, setData] = useState<dataStructure[]>([]);
  const [dataset1, setDataset1] = useState<ChartData<"line"> | undefined>(
    undefined,
  );
  const [dataset2, setDataset2] = useState<ChartData<"line"> | undefined>(
    undefined,
  );
  const [chartImage1, setChartImage1] = useState<string>("");
  const [title1, setTitle1] = useState("");
  const [title2, setTitle2] = useState("");
  const [missingDates, setMissingDates] = useState<string[]>([]);
  const [averageAmplitude, setAverageAmplitude] = useState<AngleMaxAverages | null>(null);
  const { relations, isLoading } = useRelations();

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedUser || selectedUser.length === 0 || !date) return;

      const userId = selectedUser[0].user_id;
      const startDate = date[0].toLocaleDateString('en-CA');
      const endDate = date[1].toLocaleDateString('en-CA');

      const url = `http://localhost:3001/exercise-data/${userId}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.ok) {
          setData(result);
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchData();
  }, [selectedUser, date]);

  useEffect(() => {
    if (data.length > 0) {
      const dates = data.map((item) => item.data.recorded_date);
      getAverageAmplitude(data);
      getMissingDates(data);
      const colors = [
        "rgb(99, 255, 132)",
        "rgb(255, 99, 132)",
        "rgb(99, 132, 255)",
      ];

      const angle_stretch = {
        dorsiflexion: data.map((item) => item.data.angles.dorsiflexion.map((angle) => angle)),
        eversion: data.map((item) => item.data.angles.eversion.map((angle) => angle)),
        extension: data.map((item) => item.data.angles.extension.map((angle) => angle)),
      };
      
      const force_stretch = {
        dorsiflexion: data.map((item) => item.data.torques.dorsiflexion.map((torque) => torque)),
        eversion: data.map((item) => item.data.torques.eversion.map((torque) => torque)),
        extension: data.map((item) => item.data.torques.extension.map((torque) => torque)),
      };
      
      const repetitions_done = data?.map((item) => item.data.repetitions_done);
      const repetitions_target = data?.map((item) => item.data.repetitions_target);
      // const predicted_total_time = data?.map(
      //   (element) => element.predicted_total_time,
      // );
      // const actual_total_time = data?.map(
      //   (element) => element.actual_total_time,
      // );
      const rated_pain = data?.map((element) => element.rated_pain);

      switch (graphType) {
        case "Amplitude":
          {
            const { chartData, title } = onGraphTypeChange(
              true,
              ["Dorsiflexion", "Extension", "Eversion"],
              ["Angle in degrees"],
              colors,
              dates,
              angle_stretch.dorsiflexion,
              angle_stretch.extension,
              angle_stretch.eversion
            );
      
      
            setDataset1(chartData);
            setTitle1(title);
          }
          break;

        case "Rigidity":
          {
            const { chartData, title } = onGraphTypeChange(
              false,
              ["Dorsiflexion", "Extension", "Eversion"],
              ["Force in Nm"],
              colors,
              dates,
              force_stretch.dorsiflexion,
              force_stretch.extension,
              force_stretch.eversion,
            );
            setDataset1(chartData);
            setTitle1(title);
          }
          break;
      
      
        case "Number of repetitions":
          {
            const { chartData, title } = onGraphTypeChange(
              true,
              ["Repetitions Done", "Repetitions Target"],
              ["Number of Repetitions", "Success Rate (%)"],
              colors,
              dates,
              [repetitions_done],
              [repetitions_target],
            );
            setDataset1(chartData);
            setTitle1(title);
          }
          break;
      
        // case "Total seance time":
        //   {
        //     const { chartData, title } = onGraphTypeChange(
        //       true,
        //       ["Predicted Total Time", "Actual Total Time"],
        //       ["Time in Seconds"],
        //       colors,
        //       dates,
        //       predicted_total_time,
        //       actual_total_time,
        //     );
        //     setDataset1(chartData);
        //     setTitle1(title);
        //   }
        //   break;
      
        case "Feedback":
          {
            const { chartData, title } = onGraphTypeChange(
              true,
              ["Pain Scale"],
              ["Pain Scale from 1 to 10"],
              colors,
              dates,
              rated_pain,
            );
            setDataset1(chartData);
            setTitle1(title);
          }
          break;
      
        default:
          break;
      }
    }
  }, [data, graphType]);

  function getAverageAmplitude(data: dataStructure[]) {
    // Extract angle_max values
    const angle_max = {
      dorsiflexion: data.map((item) => item.data.angle_max.dorsiflexion),
      eversion: data.map((item) => item.data.angle_max.eversion),
      extension: data.map((item) => item.data.angle_max.extension),
    };
  
    // Helper function to calculate the average
    const calculateAverage = (values: number[]) => {
      const sum = values.reduce((sum, value) => sum + value, 0);
      return values.length > 0 ? sum / values.length : 0;
    };
  
    // Calculate the average for each movement
    const angleMaxAverages: AngleMaxAverages = {
      dorsiflexion: calculateAverage(angle_max.dorsiflexion),
      eversion: calculateAverage(angle_max.eversion),
      extension: calculateAverage(angle_max.extension),
    };
  
    setAverageAmplitude(angleMaxAverages);
  }

  function getMissingDates(data: dataStructure[]) {
    const dates = data.map((item) => {
      const recordedDate = new Date(item.created_at);
      return recordedDate.toISOString().split("T")[0];
    });
  
  
    const missingDates: string[] = [];
    const dateRange = date as DateRange;
  
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);
  
    for (
      let currentDate = new Date(startDate);
      currentDate <= endDate;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      const formattedDate = currentDate.toLocaleDateString("en-CA");
      if (!dates.includes(formattedDate)) {
        missingDates.push(formattedDate);
      }
    }
  
    setMissingDates(missingDates);
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loading />
      </div>
    );
  }

  return (
    <div className=" mx-auto max-w-7xl">
      <div className="mb-4">
        <UserSearchBar
          sx={{ width: "100%", maxWidth: 500 }}
          setSearchQuery={setSelectedUser}
          users={relations}
        />
      </div>
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-gray-700"
            onClick={() => setIsGraphFilterOpen(!isGraphFilterOpen)}
          >
            <FilterAlt />
          </button>
          <DateRangePicker onChange={setDate} />

          {isGraphFilterOpen && (
            <div className="absolute top-full mt-2 left-0 z-50">
              <GraphFilters
                setGraphType={setGraphType}
                setIsGraphFilterOpen={setIsGraphFilterOpen}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center mb-4">
      <Typography variant="h6" className="text-white">
          {graphType}
        </Typography>
      </div>
      {/* <CustomScrollbar> */}
        {dataset1 && selectedUser.length > 0 && date && graphType && (
          <div className="mb-4 basis-full">
            <LineChart
              type="activity"
              setChartImage={setChartImage1}
              chartData={dataset1}
              title={title1}
            />
          </div>
        )}
        {selectedUser.length > 0 && date && graphType && (
          <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
            <Box className="flex justify-center gap-4">
              <Paper className="p-4 w-1/3">
                <Typography variant="h6" className="mb-2 text-black">
                  Missing exercise days
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {missingDates.map((date) => (
                    <Typography key={date} variant="body2" className="text-black">
                      {date}
                    </Typography>
                  ))}
                </div>
              </Paper>
              {averageAmplitude && (
                <Paper className="p-4 w-1/3">
                  <Typography variant="h6" className="mb-2 text-black">
                    Maximum Amplitude Averages
                  </Typography>
                  <Typography variant="body1" className="text-black">
                    Dorsiflexion: {averageAmplitude.dorsiflexion.toFixed(2)} degrees
                  </Typography>
                  <Typography variant="body1" className="text-black">
                    Eversion: {averageAmplitude.eversion.toFixed(2)} degrees
                  </Typography>
                  <Typography variant="body1" className="text-black">
                    Extension: {averageAmplitude.extension.toFixed(2)} degrees
                  </Typography>
                </Paper>
              )}
            </Box>
          </ThemeProvider>
        )}
      {/* </CustomScrollbar> */}
    </div>
  );
}
