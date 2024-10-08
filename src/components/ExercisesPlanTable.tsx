import DeleteIcon from "@mui/icons-material/Delete";
import React, { useState, useRef } from "react";

interface ExercisesPlanTableProps {
  setPlan: React.Dispatch<React.SetStateAction<any>>;
  setIndex: number;
  set: any;
  checkboxRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
}

const ExercisesPlanTable: React.FC<ExercisesPlanTableProps> = ({
  setPlan,
  setIndex,
  set,
  checkboxRefs,
  setChecked,
}) => {
  const exerciseOptions = ["Extension", "Dorsiflexion", "Eversion"];

  // Function to handle removing an exercise from the plan
  const removeExercise = (setIndex: number, exerciseIndex?: number) => {
    setPlan((prevPlan) => {
      // Create a shallow copy of the entire prevPlan object (which includes plan and limits)
      const updatedPlan = { ...prevPlan };

      // Create a shallow copy of the plan array
      const updatedPlanArray = [...updatedPlan.plan];

      if (exerciseIndex !== undefined) {
        // Create a shallow copy of the movement array to avoid mutating the original state
        const updatedMovementArray = [...updatedPlanArray[setIndex].movement];

        // Remove the specific exercise from the movement array
        updatedMovementArray.splice(exerciseIndex, 1);

        // Update the set with the modified movement array
        updatedPlanArray[setIndex] = {
          ...updatedPlanArray[setIndex],
          movement: updatedMovementArray,
        };

        // Optional: If no movements are left, you could choose to remove the set
        if (updatedMovementArray.length === 0) {
          updatedPlanArray.splice(setIndex, 1);
        }
      } else {
        // If no exerciseIndex is provided, remove the entire set
        updatedPlanArray.splice(setIndex, 1);
      }

      // Update the plan in the prevPlan object
      updatedPlan.plan = updatedPlanArray;

      return updatedPlan; // Return the updated object including plan and limits
    });
  };

  const handleInputChange = (
    setIndex: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    exerciseIndex?: number,
  ) => {
    const { name, value } = event.target;

    // Allow empty value for number inputs to support backspace
    let parsedValue: any;
    if (name !== "exercise") {
      // If the input is empty, leave it empty so that backspace works
      parsedValue = value === "" ? "" : parseInt(value, 10);
    } else {
      parsedValue = value; // For 'exercise', it's a text field so we directly take the value
    }

    // Prevent negative numbers for specific fields
    if (
      parsedValue !== "" &&
      [
        "repetitions",
        "rest",
        "target_angle",
        "target_torque",
        "time",
        "speed",
      ].includes(name) &&
      parsedValue < 0
    ) {
      parsedValue = 0;
    }

    setPlan((prevPlan) => {
      // Create a shallow copy of the entire prevPlan object (including plan and limits)
      const updatedPlan = { ...prevPlan };

      // Create a shallow copy of the plan array, so you don't mutate prevPlan directly
      const updatedPlanArray = [...updatedPlan.plan];

      // Now update the specific set or exercise in the plan array
      if (
        exerciseIndex !== undefined &&
        "movement" in updatedPlanArray[setIndex]
      ) {
        // Create a shallow copy of the movement array to avoid mutating state directly
        const updatedMovementArray = [...updatedPlanArray[setIndex].movement];

        // Update the specific exercise inside the movement array
        updatedMovementArray[exerciseIndex][name] = parsedValue;

        // Update the movement array in the corresponding set
        updatedPlanArray[setIndex] = {
          ...updatedPlanArray[setIndex],
          movement: updatedMovementArray,
        };
      } else {
        // Update the set field directly (e.g., repetitions, rest, etc.)
        updatedPlanArray[setIndex] = {
          ...updatedPlanArray[setIndex],
          [name]: parsedValue,
        };
      }

      // Update the plan with the new plan array, while keeping limits unchanged
      updatedPlan.plan = updatedPlanArray;

      return updatedPlan; // Return the entire updated object, including plan and limits
    });
  };

  return (
    <div className="mt-4 ml-10 mr-10 rounded-lg overflow-hidden">
      {"movement" in set ? (
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Headings */}
          <thead className="bg-gray-50">
            <tr className="divide-x divide-gray-200">
              <th className="px-6 py-3"></th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exercise
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Angle (Degrees)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Torque (Nm)
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody className="bg-white">
            {set.movement.map((element, exerciseIndex) => (
              <tr key={exerciseIndex}>
                {/* First Column */}
                {exerciseIndex === 0 && (
                  <td
                    className="px-6 py-4 text-center whitespace-nowrap"
                    rowSpan={set.movement.length}
                  >
                    <input
                      ref={(el) => (checkboxRefs.current[setIndex] = el)}
                      type="checkbox"
                      className="mr-4 size-5"
                      onChange={() => setChecked((prev) => !prev)}
                    />
                  </td>
                )}
                {/* Exercise Select */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <select
                    name="exercise"
                    value={element.exercise}
                    onChange={(e) =>
                      handleInputChange(setIndex, e, exerciseIndex)
                    }
                    className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
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
                    name="target_angle"
                    placeholder="Angle"
                    value={element.target_angle}
                    onChange={(e) =>
                      handleInputChange(setIndex, e, exerciseIndex)
                    }
                    className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="target_torque"
                    placeholder="Torque"
                    value={element.target_torque}
                    onChange={(e) =>
                      handleInputChange(setIndex, e, exerciseIndex)
                    }
                    className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    className="text-black"
                    onClick={() => removeExercise(setIndex, exerciseIndex)}
                  >
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <thead className="bg-gray-50">
            <tr className="divide-x divide-gray-200">
              <th
                colSpan={1}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Repetitions
              </th>
              <th
                colSpan={1}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rest (Sec)
              </th>
              <th
                colSpan={1}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Time (Sec)
              </th>
              <th
                colSpan={2}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Speed (Degrees/Sec)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="repetitions"
                  placeholder="Repetitions"
                  value={set.repetitions}
                  onChange={(e) => handleInputChange(setIndex, e)}
                  className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="rest"
                  placeholder="Rest"
                  value={set.rest}
                  onChange={(e) => handleInputChange(setIndex, e)}
                  className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="time"
                  placeholder="Time"
                  value={set.time}
                  onChange={(e) => handleInputChange(setIndex, e)}
                  className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                />
              </td>
              <td colSpan={2} className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="speed"
                  placeholder="Speed"
                  value={set.speed}
                  onChange={(e) => handleInputChange(setIndex, e)}
                  className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                />
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="divide-x divide-gray-200">
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Set Rest (Sec)
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  name="setRest"
                  placeholder="Set Rest"
                  value={set.setRest}
                  onChange={(e) => handleInputChange(setIndex, e)}
                  className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  className="text-black"
                  onClick={() => removeExercise(setIndex)}
                >
                  <DeleteIcon />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExercisesPlanTable;
