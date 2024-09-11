import PatientSearchBar from "../components/PatientSearchBar.tsx";
import { useEffect, useState } from "react";
import LineChart from "../components/LineChart.tsx";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import GraphFilters from "../components/GraphFilters.tsx";
import { DateRangePicker } from "rsuite";
import "rsuite/DateRangePicker/styles/index.css";
import { DateRange } from "rsuite/esm/DateRangePicker/types.js";
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
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import Report from "../components/Report.tsx";

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

export default function Activity() {
  const [selectedPatient, setSelectedPatient] = useState<any[]>([]);
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
  const [averageAmplitude, setAverageAmplitude] = useState<string>();

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedPatient || selectedPatient.length === 0 || !date) return;

      const userId = selectedPatient[0].user_id;
      const startDate = date[0].toISOString();
      const endDate = date[1].toISOString();

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
  }, [selectedPatient, date]);

  useEffect(() => {
    if (data.length > 0) {
      const xElement = data?.map((element) => element.date);
      const colors = [
        "rgb(99, 255, 132)",
        "rgb(255, 99, 132)",
        "rgb(99, 132, 255)",
      ];

      function onGraphTypeChange(
        labels: string[],
        titles: string[],
        colors: string[],
        ...args: number[[]]
      ) {
        const mappedArgs = args.map((arg: number[], index: number) => {
          return {
            animation: false,
            label: labels[index],
            data: arg,
            fill: false,
            borderColor: colors[index],
            tension: 0.1,
          };
        });

        if (graphType === "Number of repetitions") {
          setDataset1({
            labels: xElement,
            datasets: [mappedArgs[0]],
          });
          setTitle1(titles[0]);
          setDataset2({
            labels: xElement,
            datasets: [mappedArgs[1]],
          });
          setTitle2(titles[1]);
        } else {
          setDataset1({
            labels: xElement,
            datasets: mappedArgs,
          });
          setTitle1(titles[0]);
          setDataset2(undefined);
          setTitle2("");
        }
      }

      const force_avg = data?.map((element) => element.force_avg);
      const force_max = data?.map((element) => element.force_max);
      const angle_max = data?.map((element) => element.angle_max);
      const angle_target = data?.map((element) => element.angle_target);
      const repetitions_done = data?.map((element) => element.repetitions_done);
      const repetitions_success_rate = data?.map(
        (element) => element.repetitions_success_rate,
      );
      const predicted_total_time = data?.map(
        (element) => element.predicted_total_time,
      );
      const actual_total_time = data?.map(
        (element) => element.actual_total_time,
      );
      const rated_pain = data?.map((element) => element.rated_pain);

      switch (graphType) {
        case "Rigidity":
          onGraphTypeChange(
            ["average force", "maximum force"],
            ["Force in Nm"],
            colors,
            force_avg,
            force_max,
          );
          break;
        case "Amplitude":
          onGraphTypeChange(
            ["maximum angle", "target angle"],
            ["Angle in degrees"],
            colors,
            angle_max,
            angle_target,
          );
          break;
        case "Number of repetitions":
          onGraphTypeChange(
            ["repetitions done", "repetitions success rate"],
            ["Number of repetitions", "success rate in %"],
            colors,
            repetitions_done,
            repetitions_success_rate,
          );
          break;
        case "Total seance time":
          onGraphTypeChange(
            ["predicted total time", "actual total time"],
            ["Time is seconds"],
            colors,
            predicted_total_time,
            actual_total_time,
          );
          break;
        case "Feedback":
          onGraphTypeChange(
            ["pain scale"],
            ["Pain scale from 1 to 10"],
            colors,
            rated_pain,
          );
          break;
      }
    }
  }, [data, graphType]);

  useEffect(() => {
    if (data.length > 0) {
      getMissingDates(data);
      getAverageAmplitude(data);
    }
  }, [data]);

  function getAverageAmplitude(data: dataStructure[]) {
    const amplitudes: number[] = data.map((element) => element.angle_max);
    let amplitudeSum: number = 0;

    amplitudes.forEach((element) => {
      amplitudeSum = element + amplitudeSum;
    });
    setAverageAmplitude((amplitudeSum / amplitudes.length).toFixed(2));
  }

  function getMissingDates(data: dataStructure[]) {
    const oneDay = 24 * 60 * 60 * 1000;
    const missingDates: string[] = [];

    for (let i = 0; i < data.length - 1; i++) {
      const currentDate = new Date(data[i].date);
      const nextDate = new Date(data[i + 1].date);

      currentDate.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);

      const diffInDays = (nextDate.getTime() - currentDate.getTime()) / oneDay;

      for (let j = 1; j < diffInDays; j++) {
        const missingDate = new Date(currentDate.getTime() + j * oneDay);
        missingDates.push(missingDate.toISOString().split("T")[0]);
      }
    }
    setMissingDates(missingDates);
  }

  return (
    <div className="pb-4 mx-auto">
      <div className="flex justify-center">
        <PatientSearchBar
          sx={{ width: 500 }}
          setSelectedPatient={setSelectedPatient}
        />
      </div>
      <div className="grid grid-cols-5 items-center">
        <div className=" flex col-span-2">
          <button
            className="rounded-full ml-2 hover:bg-slate-700 p-1"
            onClick={() => setIsGraphFilterOpen(!isGraphFilterOpen)}
          >
            <FilterAltIcon />
          </button>
          <div>
            <DateRangePicker
              className="ml-2"
              onChange={(value: any) => setDate(value)}
            />
          </div>
        </div>
        <label className="text-white text-center">{graphType}</label>
      </div>
      {isGraphFilterOpen && (
        <GraphFilters
          setGraphType={setGraphType}
          setIsGraphFilterOpen={setIsGraphFilterOpen}
        />
      )}
      <div className="overflow-auto h-screen max-h-[calc(100vh-190px)]">
        <CustomScrollbar>
          <div className="flex justify-center">
            {dataset1 && selectedPatient?.length !== 0 && date && graphType && (
              <div className="mt-4 basis-full">
                <LineChart
                  type="activity"
                  setChartImage={setChartImage1}
                  chartData={dataset1}
                  title={title1}
                />
              </div>
            )}
            {dataset2 && selectedPatient?.length !== 0 && date && graphType && (
              <div className="mt-4 basis-full">
                <LineChart type="activity" chartData={dataset2} title={title2} />
              </div>
            )}
          </div>

          {selectedPatient.length !== 0 && date && graphType && (
            <Box
              justifyContent="center"
              sx={{ display: "flex", margin: "15px", gap: "15px" }}
            >
              <ThemeProvider
                theme={createTheme({
                  palette: {
                    mode: "light",
                    primary: { main: "rgb(102, 157, 246)" },
                    background: { paper: "rgb(235, 235, 235)" },
                  },
                })}
              >
                <Paper sx={{ width: "25vw" }}>
                  <div className="divide-x-2 flex divide-solid divide-gray-500 h-full">
                    <Typography
                      className="text-gray-500 p-2 content-center"
                      variant="h5"
                    >
                      Missing exercise days
                    </Typography>
                    {missingDates.map((element, index) => (
                      <Typography
                        key={index}
                        variant="body1"
                        className="text-black p-3 content-center text-nowrap"
                      >
                        {element}
                      </Typography>
                    ))}
                  </div>
                </Paper>
              </ThemeProvider>
              <ThemeProvider
                theme={createTheme({
                  palette: {
                    mode: "light",
                    primary: { main: "rgb(102, 157, 246)" },
                    background: { paper: "rgb(235, 235, 235)" },
                  },
                })}
              >
                <Paper sx={{ width: "25vw" }}>
                  <div className="divide-x-2 flex divide-solid divide-gray-500">
                    <Typography className="text-gray-500 p-2" variant="h5">
                      Maximum amplitude average in dates selection
                    </Typography>
                    <Typography
                      className="text-black p-3 content-center"
                      variant="body1"
                    >
                      {averageAmplitude} degrees
                    </Typography>
                  </div>
                </Paper>
              </ThemeProvider>
            </Box>
          )}
        </CustomScrollbar>
          {/* {selectedPatient?.length !== 0 && date && graphType && (
            <div className="flex mr-4 justify-end">
              <Button className="!bg-blue-600" variant="contained">
                <PDFDownloadLink
                  document={
                    <Report
                      selectedPatient={selectedPatient}
                      chartImage1={chartImage1}
                      data={data}
                      date={date}
                    />
                  }
                  fileName={`report_${selectedPatient?.[0].email}_${Date.now()}.pdf`}
                >
                  Download Report
                </PDFDownloadLink>
              </Button>
            </div>
          )} */}
      </div>
    </div>
  );
}
