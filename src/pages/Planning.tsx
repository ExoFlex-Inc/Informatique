import React, { useState } from "react";
import { supaClient } from "../hooks/supa-client.ts";
import { tokens } from "../hooks/theme.ts";
import { useTheme } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const exerciseOptions = ["Extension", "Dorsiflexion", "Eversion"];

export default function Planning() {
    const [plan, setPlan] = useState([{ exercise: "", repetitions: 0, sets: 0 }]);
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

// Function to handle changes in plan attributes
const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    // Prevent negative values for repetitions and sets
    const parsedValue = name !== "exercise" ? Math.max(0, parseInt(value)) : value;
    const updatedPlan = [...plan];
    updatedPlan[index][name] = parsedValue;
    setPlan(updatedPlan);
};


    // Function to handle adding a new exercise to the plan
    const addExercise = () => {
        setPlan(prevPlan => [...prevPlan, { exercise: "", repetitions: 0, sets: 0 }]);
    };

    // Function to handle removing an exercise from the plan
    const removeExercise = (index) => {
        setPlan(prevPlan => prevPlan.filter((_, i) => i !== index));
    };

    // Function to handle saving the plan
    const savePlan = async () => {
        try {
            // Save plan to Supabase
            await savePlanToSupabase(plan);
            // Save plan to local storage
            localStorage.setItem('plan', JSON.stringify(plan));
            console.log("Plan saved successfully.");
        } catch (error) {
            console.error("Error saving plan:", error);
        }
    };

    // Function to save plan to Supabase
    const savePlanToSupabase = async (plan) => {
        try {
            const { data } = await supaClient.auth.getSession();
            const access_token = data.session?.access_token;
            const refresh_token = data.session?.refresh_token;

            const requestBody = {
                access_token: access_token,
                refresh_token: refresh_token,
                plan: plan
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
        const allExercises = {};
        plan.forEach((exercise, index) => {
            const { exercise: exerciseName, repetitions, sets } = exercise;
            allExercises[`exercise_${index}`] = { exercise: exerciseName, repetitions, sets };
        });
        return JSON.stringify(allExercises, null, 2);
    };

    return (
        <div className="flex flex-col justify-between">
            <div className="mt-4 ml-5 mr-5">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repetitions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sets</th>
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
                                        {exerciseOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
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
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button className="text-black" onClick={() => removeExercise(index)}>
                                        <DeleteIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-center mt-1">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={addExercise}>Add Exercise</button>
            </div>
            <div className="flex justify-center mt-1">
                <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" onClick={savePlan}>Save Plan</button>
            </div>
            <div className="mt-4 ml-5 mr-5">
                <textarea
                    value={generateJsonPlan()}
                    className="text-black border border-gray-300 rounded px-2 py-1 w-full"
                    rows={10}
                    readOnly
                />
            </div>
        </div>
    );
}
