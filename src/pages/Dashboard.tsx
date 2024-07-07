import { useEffect, useState } from "react";
import LineChart from "../components/LineChart.tsx";
import { supaClient } from "../hooks/supa-client.ts";
import { dataStructure } from "./Activity.tsx";
import { ChartData } from "chart.js";
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

export default function Dashboard() {

  const [streakDay, setStreakDay] = useState<number>(0);
  const [data, setData] = useState<dataStructure[]>([]);
  const [dataset, setDataset] = useState<ChartData<"line"> | undefined>(
    undefined,
  );
  const [title, setTitle] = useState("");
  const [planData, setPlanData] = useState<any[]>([]);

  //UseEffect

  useEffect(() => {
    const fetchData = async () => {
      try {

        const {
          data: { user },
        } = await supaClient.auth.getUser();

        if (user) {
          const { data } = await supaClient
            .from("exercise_data")
            .select("*")
            .eq("user_id", user.id)
  
          if(data) {
            setData(data);
          }

          const { data: plan } = await supaClient
            .from("plans")
            .select("*")
            .eq("user_id", user.id)

          if (plan) {
            setPlanData(plan[0].plan_content.plan);
          }
        }
      } catch (error) {
        console.error("Couldn't get user exercise data", error)
      }

    }
    fetchData();
  }, [])

  useEffect (() => {

    if (data.length > 0) {
      const sortedDates = data
        .map(item => new Date(item.date))
        .sort((a, b) => a.getTime() - b.getTime());

      findStreakCount(sortedDates);

      const targetAngle = data.map((element) => element.angle_target);
      const maxAngle = data.map((element) => element.angle_max);

      defineDataset(sortedDates, targetAngle, maxAngle);

    }
  }, [data])

  useEffect (() => {
    console.log("planData",planData);
    if(planData) {

    }
  }, [planData])

  //////////////////////////////////////////////////////////////////////////////////

  //Functions

  const findStreakCount = ( sortedDates: Date[]) => {
    let streak = 1;
      
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const currentDate = sortedDates[i];
      const previousDate = sortedDates[i - 1];
      const actualDate = new Date(Date.now());

      if (i == 0) {
        break;
      }

      if (currentDate.getDate() !== actualDate.getDate() && currentDate.getMonth() !== actualDate.getMonth() && currentDate.getFullYear() !== actualDate.getFullYear()) {
        setStreakDay(0);
        break;
      }

      if (isStreakExtending(previousDate, currentDate)) {
        streak++;
      } else {
        break;
      }

    }
    setStreakDay(streak);
  }

  const isStreakExtending = (previousDate: Date, currentDate: Date) => {
    const isNextDay = (
      currentDate.getFullYear() === previousDate.getFullYear() &&
      currentDate.getMonth() === previousDate.getMonth() &&
      currentDate.getDate() === previousDate.getDate() + 1
    ) || (
      currentDate.getFullYear() === previousDate.getFullYear() &&
      currentDate.getMonth() === previousDate.getMonth() + 1 &&
      currentDate.getDate() === 1 && 
      (previousDate.getDate() === new Date(previousDate.getFullYear(), previousDate.getMonth() + 1, 0).getDate())
    ) || (
      currentDate.getFullYear() === previousDate.getFullYear() + 1 &&
      currentDate.getMonth() === 0 &&
      currentDate.getDate() === 1 &&
      previousDate.getMonth() === 11 &&
      previousDate.getDate() === 31
    );
    return isNextDay;
  }

  function defineDataset(
    sortedDates: Date[],
    ...args: number[[]]
  ) {

    const labels = ["target angle", "maximum angle"];
    const colors = [
      "rgb(99, 255, 132)",
      "rgb(255, 99, 132)",
    ];
    const title = ["Angle in degrees"];

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

    setDataset({
      labels: sortedDates,
      datasets: mappedArgs,
    })
    setTitle(title[0]);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-10 mx-10">
      <div className="bg-white rounded-lg p-4 max-h-96 overflow-auto overflow-x-hidden">
        <label style={{fontSize: 'clamp(0rem, 2.5vw, 1.5rem)'}} className="text-blue-600">Today's exercices</label>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="divide-x divide-gray-200">
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exercise
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Repetitions
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rest (sec)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planData?.map((item, index) => (
              <tr
                key={index}
                className= "bg-white"
              >
                <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                  {item.exercise}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                  {item.repetitions}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                  {item.rest}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-lg grid grid-cols-2 grid-rows-2 items-center justify-center">
        <div className="flex justify-center">
          <label style={{fontSize: 'clamp(0rem, 2.5vw, 3.75rem)'}} className="text-orange-600 text-center">
            {streakDay} day streak
          </label>
        </div>
        <div className="flex justify-center">
          <LocalFireDepartmentIcon className="text-orange-600" sx={{ fontSize: 'clamp(50px, 9vw, 200px)'}}/>
        </div>
        <div className="justify-center flex col-span-2">
          <label style={{fontSize: 'clamp(0rem, 2.5vw, 1.875rem)'}} className="text-orange-600 text-center">Exercice yourself everyday to expand your streak !</label>
        </div>
      </div>
      <div className="col-span-2">
        {dataset && <LineChart type="activity" title={title} chartData={dataset}/>}
      </div>
    </div>
  ) 
}
