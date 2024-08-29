import { useState, useEffect, useRef } from "react";
import {
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from "@mui/material";
import PatientSearchBar from "../components/PatientSearchBar.tsx";
import { blue } from "@mui/material/colors";
import ExercisesLimitsTable from "../components/ExercisesLimitsTable.tsx";
import ExercisesPlanTable from "../components/ExercisesPlanTable.tsx";

export interface Limits {
  torque: {
    dorsiflexion: number;
    extension: number;
    eversion: number;
  };
  angles: {
    dorsiflexion: number;
    extension: number;
    eversion: number;
  };
}

export interface Set {
  rest: number;
  repetitions: number;
  speed: number;
  movement: {
    exercise: string;
    target_angle: number;
    target_torque: number;
    time: number;
  }[];
}

export interface SetRest {
  setRest: number;
}

export default function Planning() {
  const [plan, setPlan] = useState<(Set | SetRest)[]>([
    {
      rest: 0,
      repetitions: 0,
      speed: 0,
      movement: [
        {
          exercise: "",
          target_angle: 0,
          target_torque: 0,
          time: 0,
        },
      ],
    },
  ]);
  const [limitsRight, setLimitsRight] = useState<Limits>({
    torque: { dorsiflexion: 0, extension: 0, eversion: 0 },
    angles: { dorsiflexion: 0, extension: 0, eversion: 0 },
  });

  const [limitsLeft, setLimitsLeft] = useState<Limits>({
    torque: { dorsiflexion: 0, extension: 0, eversion: 0 },
    angles: { dorsiflexion: 0, extension: 0, eversion: 0 },
  });
  const [selectedPatient, setSelectedPatient] = useState<any[]>([]);
  const [isDisabled, setIsDisabled] = useState(true);
  const [addExerciseDisable, setAddExerciseDisable] = useState(true);
  const [side, setSide] = useState("Left");
  const [checked, setChecked] = useState(false);
  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (plan.length < 1) {
      setAddExerciseDisable(true);
    }
  }, [plan]);

  useEffect(() => {
    if (selectedPatient.length != 0) {
      async function fetchPlanData() {
        const data = await planInit();
        if (data.loaded && data.planData[0]) {
          setPlan(data.planData[0].plan_content.plan);
          setLimitsRight(data.planData[0].plan_content.limits.right);
          setLimitsLeft(data.planData[0].plan_content.limits.left);
        }
      }
      fetchPlanData();
      selectedPatient.length == 0 ? setIsDisabled(true) : setIsDisabled(false);
    }
  }, [selectedPatient]);

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

  async function planInit() {
    try {
      if (selectedPatient) {
        console.log("Getting the current plan...");
        const responseGetPlanning = await fetch(
          "http://localhost:3001/api/plan",
          {
            method: "GET",
            headers: {
              UserId: selectedPatient[0].user_id,
            },
          },
        );

        if (responseGetPlanning.ok) {
          console.log("Plan retrieved successfully.");
          const planData = await responseGetPlanning.json();
          return { loaded: true, planData: planData };
        } else {
          console.error("Failed to retrieve plan.");
          window.alert("Failed to retrieve plan.");
          return { loaded: false, planData: null };
        }
      }
    } catch (error) {
      console.error("An error occurred:", error);
      window.alert("An error occurred: " + error);
      return { loaded: false, planData: null };
    }
  }

  const addExercise = () => {
    const checkboxIndex = checkboxRefs.current
      .map((checkbox, index) => {
        if (checkbox?.checked) {
          return index;
        }
      })
      .filter((element) => element !== undefined);

    setPlan((prevPlan) => {
      const newPlan = [...prevPlan];
      checkboxIndex.forEach((index) => {
        const item = newPlan[index];
        if (item && "movement" in item) {
          const setItem = item as Set;

          setItem.movement = [
            ...setItem.movement,
            {
              exercise: "",
              target_angle: 0,
              target_torque: 0,
              time: 0,
            },
          ];
        }
      });
      return newPlan;
    });
  };

  const addSet = () => {
    setPlan((prevPlan) => [
      ...prevPlan,
      {
        rest: 0,
        speed: 0,
        repetitions: 0,
        movement: [
          {
            exercise: "",
            target_angle: 0,
            target_torque: 0,
            time: 0,
          },
        ],
      },
    ]);
  };

  const addSetRest = () => {
    setPlan((prevPlan) => [
      ...prevPlan,
      {
        setRest: 0,
      },
    ]);
  };

  // Function to handle saving the plan and limits
  const savePlan = async () => {
    try {
      const planWithLimits = {
        plan,
        limits: {
          right: limitsRight,
          left: limitsLeft,
        },
      };
      // Save plan to Supabase
      await savePlanToSupabase(planWithLimits);
      // Save plan to local storage
    } catch (error) {
      console.error("Error saving plan and limits:", error);
    }
  };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSide((event.target as HTMLInputElement).value);
  };

  // Function to save plan to Supabase
  const savePlanToSupabase = async (plan: any) => {
    try {
      const requestBody = {
        plan: plan,
        selectedPatient: selectedPatient[0],
      };

      const response = await fetch("http://localhost:3001/api/plan", {
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

  return (
    <div className="flex flex-col custom-height">
      <div className="flex justify-center items-center">
        <FormControl>
          <FormLabel
            sx={{ "&.Mui-focused": { color: blue[600] } }}
            id="demo-controlled-radio-buttons-group"
          >
            Side
          </FormLabel>
          <RadioGroup
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            onChange={handleToggleChange}
            value={side}
          >
            <FormControlLabel
              value="Left"
              control={<Radio sx={{ "&.Mui-checked": { color: blue[600] } }} />}
              label="Left"
            />
            <FormControlLabel
              value="Right"
              control={<Radio sx={{ "&.Mui-checked": { color: blue[600] } }} />}
              label="Right"
            />
          </RadioGroup>
        </FormControl>
        <PatientSearchBar
          sx={{ width: 500 }}
          setSelectedPatient={setSelectedPatient}
        />
      </div>
      <div className="overflow-auto">
        <ExercisesLimitsTable
          limitsLeft={limitsLeft}
          limitsRight={limitsRight}
          side={side}
          setLimitsLeft={setLimitsLeft}
          setLimitsRight={setLimitsRight}
          plan={plan}
        />

        {plan.map((set, setIndex) => (
          <ExercisesPlanTable
            key={setIndex}
            set={set}
            setIndex={setIndex}
            setPlan={setPlan}
            plan={plan}
            checkboxRefs={checkboxRefs}
            setChecked={setChecked}
            checked={checked}
            limitsLeft={limitsLeft}
            limitsRight={limitsRight}
          />
        ))}
      </div>
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
          onClick={addExercise}
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
    </div>
  );
}
