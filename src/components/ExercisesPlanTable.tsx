import {
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
  Table,
  TableCell,
  Typography,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";

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
    setPlan((prevPlan: any) => {
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

    setPlan((prevPlan: any) => {
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

      updatedPlan.plan = updatedPlanArray;

      return updatedPlan;
    });
  };

  return (
    <Box>
      {set.movement.length > 0 ? (
        <TableContainer
          sx={{ borderRadius: "12px", bgcolor: "white", marginTop: "20px" }}
        >
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }} />
                <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
                  <Typography align="center" sx={{ color: "gray" }}>
                    Exercise
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
                  <Typography align="center" sx={{ color: "gray" }}>
                    Target Angle (Degrees)
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
                  <Typography align="center" sx={{ color: "gray" }}>
                    Target Torque (Nm)
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {set.movement.map((element, exerciseIndex: number) => (
                <TableRow key={exerciseIndex}>
                  {exerciseIndex === 0 && (
                    <TableCell
                      sx={{ border: "none" }}
                      className="px-6 py-4 text-center whitespace-nowrap"
                      rowSpan={set.movement.length}
                    >
                      <input
                        ref={(el) => (checkboxRefs.current[setIndex] = el)}
                        type="checkbox"
                        className="mr-4 size-5"
                        onChange={() => setChecked((prev) => !prev)}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ border: "none" }}>
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
                  </TableCell>
                  <TableCell sx={{ border: "none" }}>
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
                  </TableCell>
                  <TableCell sx={{ border: "none" }}>
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
                  </TableCell>
                  <TableCell sx={{ border: "none" }}>
                    <button
                      className="text-black"
                      onClick={() => removeExercise(setIndex, exerciseIndex)}
                    >
                      <DeleteIcon />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableHead className="bg-gray-50" sx={{ borderColor: "lightgrey" }}>
              <TableRow>
                <TableCell
                  sx={{
                    borderRight: 1,
                    borderTop: 1,
                    borderColor: "lightgrey",
                  }}
                >
                  <Typography align="center" sx={{ color: "gray" }}>
                    Repetitions
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    borderRight: 1,
                    borderTop: 1,
                    borderColor: "lightgrey",
                  }}
                >
                  <Typography align="center" sx={{ color: "gray" }}>
                    Rest (Sec)
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    borderRight: 1,
                    borderTop: 1,
                    borderColor: "lightgrey",
                  }}
                >
                  <Typography align="center" sx={{ color: "gray" }}>
                    Time (Sec)
                  </Typography>
                </TableCell>
                <TableCell
                  colSpan={2}
                  sx={{ borderTop: 1, borderColor: "lightgrey" }}
                >
                  <Typography align="center" sx={{ color: "gray" }}>
                    Speed (Degrees/Sec)
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <input
                    type="number"
                    name="repetitions"
                    placeholder="Repetitions"
                    value={set.repetitions}
                    onChange={(e) => handleInputChange(setIndex, e)}
                    className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    name="rest"
                    placeholder="Rest"
                    value={set.rest}
                    onChange={(e) => handleInputChange(setIndex, e)}
                    className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    name="time"
                    placeholder="Time"
                    value={set.time}
                    onChange={(e) => handleInputChange(setIndex, e)}
                    className="text-black border border-gray-300 text-center rounded px-2 py-1 w-full"
                  />
                </TableCell>
                <TableCell colSpan={2}>
                  <input
                    type="number"
                    name="speed"
                    placeholder="Speed"
                    value={set.speed}
                    onChange={(e) => handleInputChange(setIndex, e)}
                    className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer
          sx={{ borderRadius: "12px", bgcolor: "white", marginTop: "20px" }}
        >
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }}>
                  <Typography align="center" sx={{ color: "gray" }}>
                    Set Rest (Sec)
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: "lightgrey" }} />
              </TableRow>
            </TableHead>
            <TableBody className="bg-white">
              <TableRow>
                <TableCell>
                  <input
                    type="number"
                    name="setRest"
                    placeholder="Set Rest"
                    value={set.setRest}
                    onChange={(e) => handleInputChange(setIndex, e)}
                    className="text-black border border-gray-300 rounded text-center px-2 py-1 w-full"
                  />
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}>
                  <button
                    className="text-black"
                    onClick={() => removeExercise(setIndex)}
                  >
                    <DeleteIcon />
                  </button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ExercisesPlanTable;
