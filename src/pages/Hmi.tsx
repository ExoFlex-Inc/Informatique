import React, { useEffect, useState } from "react";
import Button from "../components/Button..tsx";

interface Stm32Data {
  errorcode: string;
  exercise: string;
  mode: string;
  positions: number[];
  repetitions: number;
  sets: number;
  torques: number[];
}


export async function hmiInit() {
  try {
    console.log("Attempting to initialize STM32 serial port...");

    const responseSerialPort = await fetch(
      "http://localhost:3001/initialize-serial-port",
      {
        method: "POST",
      },
    );

    if (responseSerialPort.ok) {
      console.log("STM32 serial port initialized successfully.");
      window.alert("STM32 serial port initialized successfully");
      return { loaded: true };
    } else {
      console.error("Failed to initialize serial port: Check STM32 connection");
      return { loaded: false };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return { loaded: false };
  }
}

export default function HMI() {
  const [loaded, setLoaded] = useState(false);
  const [retryInit, setRetryInit] = useState(true);
  const [mode, setMode] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [stm32Data, setStm32Data] = useState<Stm32Data | null>(null);
  const [currentCellIndex, setCurrentCellIndex] = useState(0);

  useEffect(() => {
    const initialize = async () => {
      const result = await hmiInit();
      setLoaded(result.loaded);

      // If initialization fails, prompt the user to retry
      if (!result.loaded) {
        window.confirm("Failed to initialize serial port. Retry?") && initialize();
      } else {
        setRetryInit(false);
      }
    };

    if (retryInit) {
      initialize();
    }
  }, [retryInit]);

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const responseGetPlanning = await fetch("http://localhost:3001/get-plan", {
          method: "GET",
        });

        if (responseGetPlanning.ok) {
          console.log("Plan retrieved successfully.");
          const planData = await responseGetPlanning.json();
          console.log("Plan data:", planData[0].plan_content.plan);
          setPlanData(planData[0].plan_content.plan);
          // setLoaded(true); // Mark as loaded when plan data is fetched
        } else {
          console.error("Failed to retrieve plan.");
          window.alert("Failed to retrieve plan.");
        }
      } catch (error) {
        console.error("An error occurred:", error);
        window.alert("An error occurred: " + error);
      }
    };

    fetchPlanData();
  }, []);

  useEffect(() => {

    const fetchStm32Data = async () => {
      try {
        const responseGetStm32Data = await fetch("http://localhost:3001/get-stm32-data", {
          method: "GET",
        });

        if (responseGetStm32Data.ok) {
          console.log("Data retrieved successfully.");
          const stm32Data = await responseGetStm32Data.json();
          console.log("Stm32 data:", stm32Data.data);
          setStm32Data(stm32Data.data);
          // setLoaded(true); // Mark as loaded when plan data is fetched
        } else {
          console.error("Failed to retrieve stm32 data.");
          window.alert("Failed to retrieve stm32 data.");
        }
      } catch (error) {
        console.error("An error occurred:", error);
        window.alert("An error occurred: " + error);
      }
    };

    fetchStm32Data();

  }, []);

  const handleButtonError = (error) => {
    setRetryInit(error);
  };

  const handleNextButtonClick = () => {
    setCurrentCellIndex(prevIndex => prevIndex + 1);
  };

  return (
    <div className="plan-grid grid-cols-3 grid-rows-2 gap-4 custom-height mr-10 ml-10">
      <div className="bg-white col-span-2 rounded-2xl">
      </div>
      <div className="bg-white rounded-2xl"></div>
      <div className="bg-white col-span-2 flex flex-col rounded-2xl">
        <div className="flex justify-center mt-20 mb-20">
          {mode === "Auto" ? (
            <Button
              label="Start"
              mode="Auto"
              action="Plan"
              className="mr-10"
              onError={handleButtonError}
            /> ) : (
              <Button
              label="Start"
              mode="Auto"
              action="Control"
              content="Start"
              className="mr-10 bg-green-500"
              onError={handleButtonError}
            />
            )}
            <Button
              label="Stop"
              mode="Auto"
              action="Control"
              content="Stop"
              className="mr-10 bg-red-500"
              onError={handleButtonError}
            />
            <Button
              label="Next"
              mode="Auto"
              action="Control"
              content="Next"
              className=""
              onClick={handleNextButtonClick}
              onError={handleButtonError}
            />
          </div>
          <div className="flex justify-center items-center">
            <Button
              label="Left"
              mode="Auto"
              action="Control"
              content="Next"
              className="mr-10 w-32 h-32"
              onError={handleButtonError}
            />
            <Button
              label="Right"
              mode="Auto"
              action="Control"
              content="next"
              className=" w-32 h-32"
              onError={handleButtonError}
            />
          </div>
          <div className="text-black bg-black">
            {stm32Data && (
              <div className="text-black">
                <h2>Current Exercice: </h2>
                <p>{stm32Data.exercise}</p>
              </div>
            )}
          </div>
      </div>
      <div className="bg-white rounded-2xl overflow-auto min-w-0"> {/* Apply rounded-2xl class here */}
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
                Sets
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planData && planData.map((item, index) => (
              <tr key={index} className={index === currentCellIndex ? 'bg-green-200' : (index % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.exercise}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.repetitions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-2xl"></div>
      <div className="bg-white rounded-2xl"></div>
    </div>
  );
}
