import DeleteIcon from "@mui/icons-material/Delete";
import { Limits, Set, SetRest } from "../pages/Planning.tsx";

interface ExercisesPlanTableProps {
  set: Set | SetRest;
  setIndex: number;
  setPlan: React.Dispatch<React.SetStateAction<(Set | SetRest)[]>>;
  plan: (Set | SetRest)[];
  checkboxRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
  checked: boolean;
  limitsRight: Limits;
  limitsLeft: Limits;
}

const ExercisesPlanTable: React.FC<ExercisesPlanTableProps> = ({
  set,
  setIndex,
  setPlan,
  plan,
  checkboxRefs,
  setChecked,
  checked,
  limitsRight,
  limitsLeft,
}) => {
  const exerciseOptions = ["Extension", "Dorsiflexion", "Eversion"];

  // Function to handle removing an exercise from the plan
  const removeExercise = (index: number) => {
    setPlan((prevPlan) => prevPlan.filter((_, i) => i !== index));
  };

  const handleInputChange = (
    setIndex: number,
    event: any,
    exerciseIndex?: number,
  ) => {
    const { name, value } = event.target;
    let parsedValue =
      value !== ""
        ? name !== "exercise"
          ? parseInt(value)
          : value
        : name !== "exercise"
          ? 0
          : "";

    if (
      ["repetitions", "rest", "target_angle", "target_torque", "time"].includes(
        name,
      ) &&
      parsedValue < 0
    ) {
      parsedValue = 0;
    }

    const updatedPlan = [...plan];
    if (exerciseIndex !== undefined && "movement" in updatedPlan[setIndex]) {
      updatedPlan[setIndex].movement[exerciseIndex][name] = parsedValue;
    } else {
      updatedPlan[setIndex][name] = parsedValue;
    }
    setPlan(updatedPlan);
    saveToLocalStorage({
      plan: updatedPlan,
      limits: {
        left: limitsLeft,
        right: limitsRight,
      },
    });
  };

  const saveToLocalStorage = (data: any) => {
    localStorage.setItem("plan", JSON.stringify(data));
  };

  return (
    <div className="mt-4 ml-10 mr-10 rounded-lg overflow-hidden">
      {"movement" in set ? (
        <table className="min-w-full divide-y divide-gray-200">
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
          <tbody className="bg-white">
            {set.movement.map((element, exerciseIndex) => (
              <tr key={exerciseIndex}>
                {exerciseIndex === 0 && (
                  <td
                    rowSpan={0}
                    className="px-6 py-4 whitespace-nowrap text-right"
                  >
                    <input
                      ref={(el) => (checkboxRefs.current[setIndex] = el)}
                      type="checkbox"
                      className="mr-4"
                      onChange={() => setChecked(!checked)}
                    />
                  </td>
                )}
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
                {exerciseIndex === 0 && (
                  <td
                    rowSpan={0}
                    className="px-6 py-4 whitespace-nowrap text-right"
                  >
                    <button
                      className="text-black"
                      onClick={() => removeExercise(setIndex)}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                )}
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
