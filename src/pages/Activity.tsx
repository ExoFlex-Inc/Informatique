import ChartsHeader from "../components/ChartsHeader.tsx";
import PatientSearchBar from "../components/PatientSearchBar.tsx";
import { useEffect, useState } from "react";
import LineChart from "../components/LineChart.tsx";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GraphFilters from "../components/GraphFilters.tsx";
import { DateRangePicker, DatePicker } from "rsuite";
import 'rsuite/DateRangePicker/styles/index.css';
import { DateRange } from "rsuite/esm/DateRangePicker/types.js";
import { supaClient } from "../hooks/supa-client.ts";

export default function Activity() {
  const [selectedPatient, setSelectedPatient] = useState<any[]>();
  const [isGraphFilterOpen, setIsGraphFilterOpen] = useState(false);
  const [graphType, setGraphType] = useState("");
  const [date, setDate] = useState<DateRange | null>();
  const [data, setData] = useState<any[]>();

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPatient?.length === 0 || !date) return;
      const { data, error } = await supaClient
        .from('exercise_data')
        .select('*')
        .eq('user_id', selectedPatient?.[0].user_id)
        .gte('date', date[0].toISOString())
        .lte('date', date[1].toISOString());

      if (error) {
        console.error(error.message)
      } else {
        setData(data);
      }
    };
    fetchData();
  }, [selectedPatient, date])

  useEffect(() => {
    
    console.log("data",data);
  }, [data]);

  return (
    <div>
      <div className="flex justify-center">
        <PatientSearchBar sx={{width: 500}} setSelectedPatient={setSelectedPatient}/>
      </div>
      <div className="grid grid-cols-5 items-center">
        <div className=" flex col-span-2">
          <button className="rounded-full ml-2 hover:bg-slate-700 p-1" onClick={() => setIsGraphFilterOpen(!isGraphFilterOpen)}>
            <FilterAltIcon />
          </button>
          <div>
            <DateRangePicker className="ml-2" onChange={(value) => setDate(value)}/>
          </div>
        </div>
        <label className="text-white text-center">{graphType}</label>
      </div>
      {isGraphFilterOpen && <GraphFilters setGraphType={setGraphType} setIsGraphFilterOpen={setIsGraphFilterOpen} />}
    </div>
  );
}
