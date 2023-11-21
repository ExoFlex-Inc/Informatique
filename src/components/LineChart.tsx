import { useState, useContext, useEffect } from "react";
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  DateTime,
  Legend,
  Tooltip,
  AxisModel,
} from "@syncfusion/ej2-react-charts";
import { registerLicense } from "@syncfusion/ej2-base";
import { supaClient } from "../hooks/supa-client.ts";
import { UserContext } from "../App.tsx";

registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1NHaF5cWWdCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdgWH5fdnVTRWhYVE11XkU=",
);

interface ChartDataItem {
  angle: number;
  time: string;
  created_at: string;
}

const LineChart = () => {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [startDate, setStartDate] = useState("2023-11-02");
  const [endDate, setEndDate] = useState("2023-11-02");
  const [timelineFormat, setTimelineFormat] = useState("MMM-d H:mm:ss"); // Default format is year
  const [selectedData, setSelectedData] = useState("dorsiflexion");
  const { profile } = useContext(UserContext);

  const handleTimelineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimelineFormat(e.target.value);
  };

  const test = async () => {
    if (profile) {
      const { data, error } = await supaClient.rpc("get_angle", {
        search_id: profile.user_id,
        start_date: startDate,
        end_date: endDate,
      });

      if (error) {
        console.error("Error:", error);
      } else {
        console.log("Success:", data);

        const newData: ChartDataItem[] = [];

        data.forEach((item: { angle_data: any; created_at: string }) => {
          if (
            item.angle_data &&
            item.created_at &&
            item.angle_data[selectedData]
          ) {
            item.angle_data[selectedData].forEach(
              (entry: { data: number; time: string }) => {
                newData.push({
                  angle: entry.data,
                  time: entry.time,
                  created_at: item.created_at, // Include created_at with each entry
                });
              },
            );
          }
        });

        console.log(newData);

        setChartData(newData); // Update state with the new chart data
      }
    } else {
      console.error("Profile not available");
    }
  };

  useEffect(() => {
    // Fetch initial data when the component mounts
    test();
  }, [startDate, endDate, selectedData]); // Fetch data when start or end date changes

  useEffect(() => {
    if (chartData.length > 0) {
      let newData = [];
      if (timelineFormat === "y-MMM") {
        const uniqueDates = new Set();
        newData = chartData
          .filter((entry) => {
            const formattedTime = new Date(`${entry.created_at} ${entry.time}`);
            const yearMonth = formattedTime.toISOString().slice(0, 7); // Extract year and month
            if (!uniqueDates.has(yearMonth)) {
              uniqueDates.add(yearMonth);
              return true;
            }
            return false;
          })
          .map((entry) => {
            const formattedTime = new Date(`${entry.created_at} ${entry.time}`);
            return {
              x: formattedTime,
              y: entry.angle,
              angle: entry.angle,
              time: entry.time,
              created_at: entry.created_at,
            };
          });
        console.log(newData);
        setChartData(newData);
      }
    }
  }, [timelineFormat]);

  const lineCustomSeries = [
    {
      dataSource: chartData.map(
        (entry: { angle: number; time: string; created_at: string }) => ({
          x: new Date(`${entry.created_at} ${entry.time}`),
          y: entry.angle,
        }),
      ),
      type: "Line",
      marker: { visible: true },
    },
  ];

  // Customize the labelFormat for the X-axis to display in different intervals based on the selected value
  const LinePrimaryXAxis: AxisModel = {
    valueType: "DateTime",
    labelFormat: timelineFormat, // Update labelFormat based on the selected value
  };
  const LinePrimaryYAxis: AxisModel = {};

  return (
    <>
      <ChartComponent
        id="line-chart"
        height="420px"
        primaryXAxis={LinePrimaryXAxis}
        primaryYAxis={LinePrimaryYAxis}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        background={"#fff"}
        legendSettings={{ background: "white" }}
      >
        <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
        <SeriesCollectionDirective>
          <SeriesDirective
            dataSource={lineCustomSeries[0].dataSource}
            xName="x"
            yName="y"
            type="Line"
            marker={{ visible: true }}
          />
        </SeriesCollectionDirective>
      </ChartComponent>

      <div className="text-black">
        Start Date:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mr-8"
        />
        End Date:
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="text-black mt-8">
        Select Data:
        <select
          value={selectedData}
          onChange={(e) => setSelectedData(e.target.value)}
        >
          <option value="dorsiflexion">Dorsiflexion</option>
          <option value="eversion">Eversion</option>
          <option value="extension">Extension</option>
        </select>
      </div>
      <div className="text-black mt-8">
        Select Timeline:
        <select value={timelineFormat} onChange={handleTimelineChange}>
          <option value=" MMM-d H:mm:ss">Month-Day</option>
          <option value="y-MMM">Year-Month</option>
        </select>
      </div>
    </>
  );
};

export default LineChart;
