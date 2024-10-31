import UserSearchBar from "../components/UserSearchBar.tsx";
import { useEffect, useState } from "react";
import LineChart from "../components/LineChart.tsx";
import { FilterAlt } from "@mui/icons-material";
import GraphFilters from "../components/GraphFilters.tsx";
import { DateRangePicker } from "rsuite";
import "rsuite/DateRangePicker/styles/index.css";
import { ChartData } from "chart.js";
import {
  Box,
  ThemeProvider,
  createTheme,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CustomScrollbar from "../components/CustomScrollbars.tsx";
import { useRelations } from "../hooks/use-relations.ts";
import Loading from "../components/Loading.tsx";

export interface dataStructure {
  data: {
    angle_max: {
      dorsiflexion: number[];
      eversion: number[];
      extension: number[];
    };
    angles: {
      dorsiflexion: number[];
      eversion: number[];
      extension: number[];
    };
    torques: {
      dorsiflexion: number[];
      eversion: number[];
      extension: number[];
    };
    repetitions_done: number;
    repetitions_target: number;
    recorded_date: string;
  };
  id: string;
  created_at: string;
  user_id: string;
  rated_pain?: number;
}
interface AngleMaxAverages {
  dorsiflexion: number;
  eversion: number;
  extension: number;
}

type DateRange = [Date, Date];

function onGraphTypeChange(
  show_points: boolean,
  labels: string[],
  titles: string[],
  colors: string[],
  dates: string[],
  ...args: (number[] | undefined)[]
) {
  const mappedArgs = args.map(
    (arg: number[] | undefined, index: number) => {
      const dataPoints = [];
      let cumulativeIndex = 0;

      if (!arg) return {
        label: labels[index],
        data: [],
        borderColor: colors[index],
        fill: false,
        tension: 0.1,
        pointRadius: show_points ? 5 : 2,
        pointHoverRadius: 7,
      };

      const recordedDate = dates[index] ?? ""; // Use the date at the args index

      for (let i = 0; i < arg.length; i++) {
        const yValue = arg[i];
        if (yValue !== undefined && yValue !== null) {
          dataPoints.push({
            x: cumulativeIndex + 1,
            y: yValue,
            recorded_date: recordedDate, // Apply the same date to all points in this arg
          });
        }
        cumulativeIndex++;
      }

      return {
        label: labels[index],
        data: dataPoints,
        borderColor: colors[index],
        fill: false,
        tension: 0.1,
        pointRadius: show_points ? 5 : 2,
        pointHoverRadius: 7,
      };
    },
  );

  // Update x-axis labels based on the cumulative data points
  const xAxisLabels = mappedArgs[0]?.data?.map((point) => point.x) ?? [];

  return {
    chartData: {
      labels: xAxisLabels,
      datasets: mappedArgs,
    },
    title: titles[0] || "",
  };
}

export default function Activity() {
  const [selectedUser, setSelectedUser] = useState<any[]>([]);
  const [isGraphFilterOpen, setIsGraphFilterOpen] = useState(false);
  const [graphType, setGraphType] = useState("Amplitude");
  const [date, setDate] = useState<DateRange | null>();
  const [data, setData] = useState<dataStructure[]>([]);
  const [dataset1, setDataset1] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  });

  const [averageData, setAverageData] = useState<any>({});
  const [title1, setTitle1] = useState("");
  const [missingDates, setMissingDates] = useState<string[]>([]);
  const { relations, isLoading } = useRelations();
  const [availableSessions, setAvailableSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedUser || selectedUser.length === 0 || !date) return;

      const userId = selectedUser[0].user_id;
      const startDate = date[0].toISOString();
      const endDate = date[1].toISOString();

      const url = `http://localhost:3001/exercise-data/dates/${userId}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

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

          // Put the date in the client timezone
          const startDate = date[0].toLocaleDateString("en-CA");
          const endDate = date[1].toLocaleDateString("en-CA");

          // Check if the selected date range is only one day
          if (startDate === endDate) {
            // Extract available sessions for this day
            const sessionTimes = result.map(
              (item: any) => item.data.recorded_date,
            );
            setAvailableSessions(sessionTimes); // Set available sessions for dropdown
            setSelectedSession(
              sessionTimes.length > 0 ? sessionTimes[0] : null,
            ); // Default to the first session
          } else {
            setAvailableSessions([]); // Reset available sessions if date range is more than one day
            setSelectedSession(null); // Reset the selected session
          }
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error((error as any).message);
      }
    };

    fetchData();
  }, [selectedUser, date]);

  useEffect(() => {
    if (graphType && date !== null) {
      if (data.length > 0) {
        // Filter the data based on the selected session (if any)
        const filteredData = selectedSession
          ? data.filter((item) => item.data.recorded_date === selectedSession)
          : data;

        const dates = filteredData.map((item) => item.data.recorded_date);
        const colors = [
          "rgb(99, 255, 132)",
          "rgb(255, 99, 132)",
          "rgb(99, 132, 255)",
        ];

        const angle_stretch = {
          dorsiflexion: filteredData.flatMap((item) => item.data.angles.dorsiflexion),
          eversion: filteredData.flatMap((item) => item.data.angles.eversion),
          extension: filteredData.flatMap((item) => item.data.angles.extension),
        };

        const force_stretch = {
          dorsiflexion: filteredData.flatMap((item) => item.data.torques.dorsiflexion),
          eversion: filteredData.flatMap((item) => item.data.torques.eversion),
          extension: filteredData.flatMap((item) => item.data.torques.extension),
        };

        const repetitions_done = filteredData?.map(
          (item) => item.data.repetitions_done,
        );
        const repetitions_target = filteredData?.map(
          (item) => item.data.repetitions_target,
        );

        const rated_pain = filteredData?.map((element) => [element.rated_pain]);

        switch (graphType) {
          case "Amplitude":
            {
              const { chartData, title } = onGraphTypeChange(
                false,
                ["Dorsiflexion", "Extension", "Eversion"],
                ["Angle in degrees"],
                colors,
                dates,
                angle_stretch.dorsiflexion,
                angle_stretch.extension,
                angle_stretch.eversion,
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
                ["Number of Repetitions"],
                colors,
                dates,
                repetitions_done.flat(),
                repetitions_target.flat(),
              );
              setDataset1(chartData);
              setTitle1(title);
            }
            break;

          case "Feedback":
            {
              const { chartData, title } = onGraphTypeChange(
                true,
                ["Pain Scale"],
                ["Pain Scale from 1 to 5"],
                colors,
                dates,
                rated_pain.flat().filter((item): item is number => item !== undefined),
              );
              setDataset1(chartData);
              setTitle1(title);
            }
            break;

          default:
            break;
        }
      } else {
        setDataset1({
          labels: [],
          datasets: [],
        });
        setTitle1("");
      }
    } else {
      setDataset1({
        labels: [],
        datasets: [],
      });
      setTitle1("");
    }
  }, [data, date, graphType, selectedSession]);

  function handleSessionChange(event: any) {
    setSelectedSession(event.target.value);
  }

  useEffect(() => {
    if (data && date !== null && date !== undefined) {
      getMissingDates(data, date);
      getAverage(data, graphType);
    } else {
      setMissingDates([]);
      setAverageData(null);
    }
  }, [data, graphType]);

  function getAverage(data: dataStructure[], graphType: string) {
    // Helper function to calculate the average
    const calculateAverage = (values: (number | undefined)[]) => {
      const validValues = values.filter(
        (value): value is number => value !== undefined,
      );
      const sum = validValues.reduce((sum, value) => sum + value, 0);
      return validValues.length > 0 ? sum / validValues.length : 0;
    };

    switch (graphType) {
      case "Amplitude":
        // Compute average of angles
        const angles = {
          dorsiflexion: data.flatMap((item) => item.data.angles.dorsiflexion),
          eversion: data.flatMap((item) => item.data.angles.eversion),
          extension: data.flatMap((item) => item.data.angles.extension),
        };
        const angleAverages: AngleMaxAverages = {
          dorsiflexion: calculateAverage(angles.dorsiflexion),
          eversion: calculateAverage(angles.eversion),
          extension: calculateAverage(angles.extension),
        };
        setAverageData(angleAverages);
        break;

      case "Rigidity":
        // Compute average of torques
        const torques = {
          dorsiflexion: data.flatMap((item) => item.data.torques.dorsiflexion),
          eversion: data.flatMap((item) => item.data.torques.eversion),
          extension: data.flatMap((item) => item.data.torques.extension),
        };
        const torqueAverages: AngleMaxAverages = {
          dorsiflexion: calculateAverage(torques.dorsiflexion),
          eversion: calculateAverage(torques.eversion),
          extension: calculateAverage(torques.extension),
        };
        setAverageData(torqueAverages);
        break;

      case "Number of repetitions":
        // Compute average of repetitions
        const repetitionsDone = data.map((item) => item.data.repetitions_done);
        const repetitionsTarget = data.map(
          (item) => item.data.repetitions_target,
        );
        const averageRepetitionsDone = calculateAverage(repetitionsDone);
        const averageRepetitionsTarget = calculateAverage(repetitionsTarget);
        const repetitionsAverages = {
          repetitionsDone: averageRepetitionsDone,
          repetitionsTarget: averageRepetitionsTarget,
        };
        setAverageData(repetitionsAverages);
        break;

      case "Feedback":
        // Compute average of rated_pain
        const ratedPain = data.map((item) => item.rated_pain);
        const averagePain = calculateAverage(ratedPain);
        setAverageData({ averagePain });
        break;

      default:
        setAverageData(null);
        break;
    }
  }

  function getMissingDates(data: dataStructure[], dateRange: DateRange) {
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);

    const dates = data.map((item) => {
      // Remove the timezone abbreviation
      const cleanedDateString = item.data.recorded_date.replace(/\s*\b[A-Z]{3}\b$/, '');
      // Replace ', ' with 'T' to create an ISO string
      const isoDateString = cleanedDateString.replace(', ', 'T');
      const date = new Date(isoDateString);
      // Format the date as 'YYYY-MM-DD'
      const formattedDate =
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0');
      return formattedDate;
    });

    const missingDates: string[] = [];

    // Generate all dates in the date range
    for (
      let currentDate = new Date(startDate);
      currentDate <= endDate;
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    ) {
      const formattedDate = currentDate.toISOString().split("T")[0];
      if (formattedDate && !dates.includes(formattedDate)) {
        missingDates.push(formattedDate);
      }
    }

    setMissingDates(missingDates);
  }

  function getAverageTitle(graphType: string): string {
    switch (graphType) {
      case "Amplitude":
        return "Average Angles";
      case "Rigidity":
        return "Average Torques";
      case "Number of repetitions":
        return "Average Repetitions";
      case "Feedback":
        return "Average Pain";
      default:
        return "";
    }
  }

  function renderAverageData(averageData: any, graphType: string) {
    if (!averageData) {
      return null;
    }
    switch (graphType) {
      case "Amplitude":
      case "Rigidity":
        return (
          <>
            {averageData.dorsiflexion !== undefined && (
              <Typography variant="body1" className="text-black">
                Dorsiflexion: {averageData.dorsiflexion.toFixed(2)}{" "}
                {graphType === "Amplitude" ? "degrees" : "Nm"}
              </Typography>
            )}
            {averageData.eversion !== undefined && (
              <Typography variant="body1" className="text-black">
                Eversion: {averageData.eversion.toFixed(2)}{" "}
                {graphType === "Amplitude" ? "degrees" : "Nm"}
              </Typography>
            )}
            {averageData.extension !== undefined && (
              <Typography variant="body1" className="text-black">
                Extension: {averageData.extension.toFixed(2)}{" "}
                {graphType === "Amplitude" ? "degrees" : "Nm"}
              </Typography>
            )}
          </>
        );

      case "Number of repetitions":
        return (
          <>
            {averageData.repetitionsDone !== undefined && (
              <Typography variant="body1" className="text-black">
                Repetitions Done: {averageData.repetitionsDone.toFixed(2)}
              </Typography>
            )}
            {averageData.repetitionsTarget !== undefined && (
              <Typography variant="body1" className="text-black">
                Repetitions Target: {averageData.repetitionsTarget.toFixed(2)}
              </Typography>
            )}
          </>
        );

      case "Feedback":
        return (
          <>
            {averageData.averagePain !== undefined && (
              <Typography variant="body1" className="text-black">
                Average Pain: {averageData.averagePain.toFixed(2)} / 5
              </Typography>
            )}
          </>
        );

      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loading />
      </div>
    );
  }

  return (
    <div className=" flex flex-col custom-height mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {/* User Search Bar */}
        <div className="flex-grow max-w-md">
          <UserSearchBar
            sx={{ width: "100%" }}
            setSearchQuery={setSelectedUser}
            users={relations}
          />
        </div>

        {/* Conditional Form Control */}
        {date &&
          date[0].toLocaleDateString() === date[1].toLocaleDateString() &&
          availableSessions.length > 1 && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="session-select-label">Select Session</InputLabel>
              <Select
                labelId="session-select-label"
                id="session-select"
                value={selectedSession}
                label="Select Session"
                onChange={handleSessionChange}
              >
                {availableSessions.map((session) => (
                  <MenuItem key={session} value={session}>
                    {session}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
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
      <CustomScrollbar>
        <div className="mb-4 basis-full">
          <LineChart type="activity" chartData={dataset1} title={title1} />
        </div>
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

            <Paper className="p-4 w-1/3">
              <Typography variant="h6" className="mb-2 text-black">
                {getAverageTitle(graphType)}
              </Typography>
              {renderAverageData(averageData, graphType)}
            </Paper>
          </Box>
        </ThemeProvider>
      </CustomScrollbar>
    </div>
  );
}
