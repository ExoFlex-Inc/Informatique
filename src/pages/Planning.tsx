import { useState, useEffect } from "react";
import { tokens } from "../hooks/theme.ts";
import { useTheme } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export async function planInit() {
  try {
    console.log("Getting the current plan...");

    const responseGetPlanning = await fetch("http://localhost:3001/get-plan", {
      method: "GET",
    });

    if (responseGetPlanning.ok) {
      console.log("Plan retrieved successfully.");
      const planData = await responseGetPlanning.json();
      console.log("Plan data:", planData);
      return { loaded: true, planData: planData };
    } else {
      console.error("Failed to retrieve plan.");
      window.alert("Failed to retrieve plan.");
      return { loaded: false, planData: null };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    window.alert("An error occurred: " + error);
    return { loaded: false, planData: null };
  }
}

const exerciseOptions = ["Extension", "Dorsiflexion", "Eversion"];

export default function Planning() {
  const [plan, setPlan] = useState([
    {
      exercise: "",
      repetitions: 0,
      sets: 0,
      rest: 0,
      target_angle: 0,
      target_torque: 0,
      time: 0,
    },
  ]);
  const [limits, setLimits] = useState({
    torque: { dorsiflexion: 0, extension: 0, eversion: 0 },
    angles: { dorsiflexion: 0, extension: 0, eversion: 0 },
  });
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  useEffect(() => {
    const savedPlan = localStorage.getItem("plan");
    if (savedPlan) {
      const parsedPlan = JSON.parse(savedPlan);
      setPlan(parsedPlan.plan);
      setLimits(parsedPlan.limits);
    } else {
      async function fetchPlanData() {
        const data = await planInit();
        if (data.loaded && data.planData[0]) {
          setPlan(data.planData[0].plan_content.plan);
          setLimits(data.planData[0].plan_content.limits);
        }
      }
      fetchPlanData();
    }
  }, []);

  const saveToLocalStorage = (data) => {
    localStorage.setItem("plan", JSON.stringify(data));
  };

  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    let parsedValue = "";
    if (value !== "") {
      parsedValue = name !== "exercise" ? Math.max(0, parseInt(value)) : value;
    }
    const updatedPlan = [...plan];
    updatedPlan[index][name] = parsedValue;
    setPlan(updatedPlan);
    saveToLocalStorage({ plan: updatedPlan, limits });
  };

  const handleTorqueLimitChange = (event) => {
    const { name, value } = event.target;
    let parsedValue = "";
    if (value !== "") {
      parsedValue = Math.max(0, parseInt(value));
    }
    setLimits((prevLimits) => ({
      ...prevLimits,
      torque: { ...prevLimits.torque, [name]: parsedValue },
    }));
    saveToLocalStorage({
      plan,
      limits: { ...limits, torque: { ...limits.torque, [name]: parsedValue } },
    });
  };

  const handleAngleLimitChange = (event) => {
    const { name, value } = event.target;
    let parsedValue = "";
    if (value !== "") {
      parsedValue = Math.max(0, parseInt(value));
    }
    setLimits((prevLimits) => ({
      ...prevLimits,
      angles: { ...prevLimits.angles, [name]: parsedValue },
    }));
    saveToLocalStorage({
      plan,
      limits: { ...limits, angles: { ...limits.angles, [name]: parsedValue } },
    });
  };

  // Function to handle adding a new exercise to the plan
  const addExercise = () => {
    setPlan((prevPlan) => [
      ...prevPlan,
      {
        exercise: "",
        repetitions: 0,
        sets: 0,
        rest: 0,
        target_angle: 0,
        target_torque: 0,
        time: 0,
      },
    ]);
  };

  // Function to handle removing an exercise from the plan
  const removeExercise = (index) => {
    setPlan((prevPlan) => prevPlan.filter((_, i) => i !== index));
  };

  // Function to handle saving the plan and limits
  const savePlan = async () => {
    try {
      const planWithLimits = { plan, limits };
      // Save plan to Supabase
      await savePlanToSupabase(planWithLimits);
      // Save plan to local storage
      console.log("Plan and limits saved successfully.");
    } catch (error) {
      console.error("Error saving plan and limits:", error);
    }
  };

  // Function to save plan to Supabase
  const savePlanToSupabase = async (plan) => {
    try {
      const requestBody = {
        plan: plan,
      };

      const response = await fetch("http://localhost:3001/push-plan-supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("Plan pushed to Supabase");
      } else {
        console.error("Failed to send plan to Supabase");
      }
    } catch (error) {
      console.error("Error saving plan to Supabase:", error);
    }
  };

  // Function to generate JSON plan
  const generateJsonPlan = () => {
    const allExercises = plan.map((exercise, index) => {
      const {
        exercise: exerciseName,
        repetitions,
        sets,
        rest,
        target_angle,
        target_torque,
        time,
      } = exercise;
      return {
        exercise: exerciseName,
        repetitions,
        sets,
        rest,
        target_angle,
        target_torque,
        time,
      };
    });

    return JSON.stringify({ plan: allExercises, limits }, null, 2);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="mt-4 ml-10 mr-10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 divide-y divide-gray-200">
            <tr className="bg-gray-50 divide-x divide-gray-200">
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                colSpan={3}
              >
                Max Torque
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                colSpan={3}
              >
                Max Angle
              </th>
            </tr>
            <tr className="bg-gray-50 divide-x divide-gray-200">
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dorsiflexion
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extension
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eversion
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dorsiflexion
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                extension
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eversion
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="dorsiflexion"
                  value={limits.torque.dorsiflexion}
                  onChange={handleTorqueLimitChange}
                  className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="extension"
                  value={limits.torque.extension}
                  onChange={handleTorqueLimitChange}
                  className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="eversion"
                  value={limits.torque.eversion}
                  onChange={handleTorqueLimitChange}
                  className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="dorsiflexion"
                  value={limits.angles.dorsiflexion}
                  onChange={handleAngleLimitChange}
                  className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="extension"
                  value={limits.angles.extension}
                  onChange={handleAngleLimitChange}
                  className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="eversion"
                  value={limits.angles.eversion}
                  onChange={handleAngleLimitChange}
                  className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 ml-10 mr-10">
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
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rest (sec)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Angle
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Torque
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time (sec)
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plan.map((exercise, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    name="exercise"
                    value={exercise.exercise}
                    onChange={(e) => handleInputChange(index, e)}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                  >
                    <option value="">Select Exercise</option>
                    {exerciseOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="repetitions"
                    placeholder="Repetitions"
                    value={exercise.repetitions}
                    onChange={(e) => handleInputChange(index, e)}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="sets"
                    placeholder="Sets"
                    value={exercise.sets}
                    onChange={(e) => handleInputChange(index, e)}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="rest"
                    placeholder="Rest"
                    value={exercise.rest}
                    onChange={(e) => handleInputChange(index, e)}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="target_angle"
                    placeholder="Angle"
                    value={exercise.target_angle}
                    onChange={(e) => handleInputChange(index, e)}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="target_torque"
                    placeholder="Torque"
                    value={exercise.target_torque}
                    onChange={(e) => handleInputChange(index, e)}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="time"
                    placeholder="Time"
                    value={exercise.time}
                    onChange={(e) => handleInputChange(index, e)}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    className="text-black"
                    onClick={() => removeExercise(index)}
                  >
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mr-4 rounded"
          onClick={addExercise}
        >
          Add Exercise
        </button>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          onClick={savePlan}
        >
          Save Plan
        </button>
      </div>
      <div className="mt-4 ml-10 mr-10">
        <textarea
          value={generateJsonPlan()}
          className="text-black border border-gray-300 rounded px-2 py-1 w-full"
          rows={20}
          readOnly
        />
      </div>
    </div>
  );
}
