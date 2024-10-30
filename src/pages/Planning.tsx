import { useState, useEffect, useRef } from "react";
import {
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Typography,
  Box,
} from "@mui/material";
import UserSearchBar from "../components/UserSearchBar.tsx";
import ExercisesLimitsTable from "../components/ExercisesLimitsTable.tsx";
import ExercisesPlanTable from "../components/ExercisesPlanTable.tsx";
import CustomScrollbar from "../components/CustomScrollbars.tsx";
import { useRelations } from "../hooks/use-relations.ts";
import { usePlan } from "../hooks/use-plan.ts";
import Loading from "../components/Loading.tsx";
import { Side } from "../components/ToggleSide.tsx";
import ToggleSide from "../components/ToggleSide.tsx";
import { useQueryClient } from "@tanstack/react-query";

export default function Planning() {
  const [selectedUser, setSelectedUser] = useState<any[]>([]);
  const [isDisabled, setIsDisabled] = useState(true);
  const [addExerciseDisable, setAddExerciseDisable] = useState(true);
  const [side, setSide] = useState<Side>(null);
  const [checked, setChecked] = useState(false);
  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { relations, isLoading: isLoadingRelations } = useRelations();
  const {
    planData,
    isLoading: isLoadingPlan,
    addExercise,
    addSet,
    addSetRest,
    setLimitLeft,
    setLimitRight,
    setPlan,
  } = usePlan(selectedUser.length === 1 ? selectedUser[0]?.user_id : null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (planData) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [planData]);

  useEffect(() => {
    const filteredCheckbox = checkboxRefs.current.filter((element) => {
      if (element?.checked) {
        return true;
      }
      return false;
    });
    if (filteredCheckbox.length > 0) {
      setAddExerciseDisable(false);
    } else {
      setAddExerciseDisable(true);
    }
  }, [checked]);

  const handleAddExercise = () => {
    const checkboxIndex = checkboxRefs.current
      .map((checkbox, index) => {
        if (checkbox?.checked) {
          return index;
        }
      })
      .filter((element) => element !== undefined) as number[]; // Ensure it's a number[]

    // Pass the checkbox index directly to the mutation
    addExercise(checkboxIndex);
  };

  // Function to handle saving the plan and limits
  const savePlan = async () => {
    try {
      // Save plan to Supabase
      await savePlanToSupabase(planData);
    } catch (error) {
      console.error("Error saving plan and limits:", error);
    }
  };

  // Function to save plan to Supabase
  const savePlanToSupabase = async (plan: any) => {
    try {
      const requestBody = {
        plan: plan,
        user_id: selectedUser[0].user_id,
      };

      const response = await fetch("http://localhost:3001/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("Plan pushed to Supabase");
        window.alert("Plan and limits saved successfully.");
      } else {
        console.error("Failed to send plan to Supabase");
        window.alert("Failed to send plan to Supabase");
      }
    } catch (error) {
      console.error("Error saving plan to Supabase:", error);
    }
  };

  if (isLoadingRelations || isLoadingPlan) {
    return (
      <div className="loading-container">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col custom-height">
      <div className="flex justify-center items-center">
        <ToggleSide side={side} setSide={setSide} />
        <UserSearchBar
          sx={{ width: 500 }}
          setSearchQuery={setSelectedUser}
          users={relations}
        />
      </div>
      <CustomScrollbar>
        <div className="overflow-auto m-6">
          <ExercisesLimitsTable
            limitsLeft={planData?.limits?.left}
            limitsRight={planData?.limits?.right}
            side={side}
            setLimitLeft={setLimitLeft}
            setLimitRight={setLimitRight}
          />

          {planData && planData.plan ? (
            planData.plan.map((set, setIndex) => (
              <ExercisesPlanTable
                key={setIndex}
                setPlan={setPlan}
                set={set}
                setIndex={setIndex}
                checkboxRefs={checkboxRefs}
                setChecked={setChecked}
              />
            ))
          ) : (
            <Box className="flex justify-center items-center">
              <Typography sx={{ color: "gray" }} fontSize={"30px"}>
                No plan available for the selected user.
              </Typography>
            </Box>
            // <div className="flex justify-center items-center">
            //   <p className="text-gray-500 text-lg">
            //   </p>
            // </div>
          )}
        </div>
        {planData && planData.plan ? (
          <div className="flex justify-center my-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mr-4 rounded"
              onClick={addSet}
            >
              Add Set
            </button>

            <button
              className="bg-rose-500 hover:bg-rose-700 text-white font-bold py-2 px-4 mr-4 rounded"
              onClick={addSetRest}
            >
              Add Set Rest
            </button>

            <button
              disabled={addExerciseDisable}
              className={
                addExerciseDisable
                  ? "bg-gray-500 text-white font-bold py-2 px-4 mr-4 rounded cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 mr-4 rounded"
              }
              onClick={handleAddExercise}
            >
              Add Exercise
            </button>
            <button
              className={`text-white font-bold py-2 px-4 rounded
                ${isDisabled ? "bg-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-700"}`}
              onClick={savePlan}
              disabled={isDisabled}
            >
              Save Plan
            </button>
          </div>
        ) : (
          true
        )}
      </CustomScrollbar>
    </div>
  );
}
