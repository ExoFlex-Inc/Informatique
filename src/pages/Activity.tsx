import PatientSearchBar from "../components/PatientSearchBar.tsx";
import { useEffect, useState } from "react";
import LineChart from "../components/LineChart.tsx";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import GraphFilters from "../components/GraphFilters.tsx";
import { DateRangePicker } from "rsuite";
import "rsuite/DateRangePicker/styles/index.css";
import { DateRange } from "rsuite/esm/DateRangePicker/types.js";
import { supaClient } from "../hooks/supa-client.ts";
import { ChartData } from "chart.js";
import { Button } from "@mui/material";
import { PDFDownloadLink } from "@react-pdf/renderer";
import Report from "../components/Report.tsx";

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

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPatient?.length === 0 || !date) return;
      const { data, error } = await supaClient
        .from("exercise_data")
        .select("*")
        .eq("user_id", selectedPatient?.[0].user_id)
        .gte("date", date[0].toISOString())
        .lte("date", date[1].toISOString());

      if (error) {
        console.error(error.message);
      } else {
        setData(data);
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

  return (
    <div className="container mx-auto">
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
      {selectedPatient?.length !== 0 && date && (
        <Button
          className="!bg-blue-600 absolute right-4 bottom-4"
          variant="contained"
        >
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
      )}
    </div>
  );
}
