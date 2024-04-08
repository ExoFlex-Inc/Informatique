import React, { useState, useEffect } from "react";
import CircularProgress, {
  CircularProgressProps,
} from "@mui/material/CircularProgress";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        size="9.375rem"
        variant="determinate"
        color="success"
        {...props}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="black"
          fontSize={30}
        >{`${Math.min(Math.round(props.value), 100)}%`}</Typography>
      </Box>
    </Box>
  );
}

interface Props {
  stm32Data: any | null;
  planData: any;
}

export default function ProgressionWidget({ stm32Data, planData }: Props) {
  const [stretchProgress, setStretchProgress] = useState(0);
  const [totalStretch, setTotalStretch] = useState(1);
  const [repetitionProgress, setRepetitionProgress] = useState(0);
  const [totalRepetition, setTotalRepetition] = useState(0);

  useEffect(() => {
    if (stm32Data?.Repetitions !== undefined) {
      setRepetitionProgress(stm32Data.Repetitions);
    }
    if (stm32Data?.Repetitions !== 0 && stm32Data?.Repetitions !== undefined) {
      console.log(stm32Data?.Repetitions);

      setStretchProgress(stretchProgress + 1);
    }
  }, [stm32Data?.Repetitions]);

  useEffect(() => {
    if (planData && stm32Data?.ExerciseIdx !== undefined) {
      const currentPlan = planData.plan[stm32Data.ExerciseIdx];
      if (currentPlan && currentPlan.repetitions !== undefined) {
        setTotalRepetition(currentPlan.repetitions);
      }
    }
  }, [planData, stm32Data?.ExerciseIdx]);

  useEffect(() => {
    if (stm32Data?.ExerciseIdx !== undefined) {
      if (stm32Data.ExerciseIdx === 0 && stm32Data.Repetitions === 0) {
        setStretchProgress(0);
      }
    }
  }, [stm32Data?.ExerciseIdx, stm32Data?.Repetitions]);

  useEffect(() => {
    if (planData && planData.plan) {
      let total = 0;
      planData.plan.forEach((plan: any) => {
        if (plan && plan.repetitions !== undefined) {
          total += plan.repetitions;
        }
      });
      setTotalStretch(total);
    }
  }, [planData]);

  return (
    <div className="">
      <div className="flex justify-center mb-2.5">
        <CircularProgressWithLabel
          value={(stretchProgress / totalStretch) * 100}
        />
      </div>
      <p className="text-black justify-center flex mb-7">Stretch Progress</p>
      <p className="text-black justify-center flex mb-1 text-xl">
        {repetitionProgress + "/" + totalRepetition}
      </p>
      <div className="flex justify-center mb-1">
        <Box sx={{ width: "75%" }}>
          <LinearProgress
            color="success"
            variant="determinate"
            value={(repetitionProgress / totalRepetition) * 100}
          />
        </Box>
      </div>
      <p className="text-black justify-center flex">Repetitions Progress</p>
    </div>
  );
}
