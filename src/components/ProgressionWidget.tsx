import React, { useContext, useEffect, useMemo } from "react";
import {
  Box,
  CircularProgress,
  type CircularProgressProps,
  Typography,
  LinearProgress,
  Grid,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DisablePagesContext } from "../context/DisablePagesContext";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        size="8rem"
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
  setOpenDialogPainScale: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ProgressionWidget({
  stm32Data,
  planData,
  setOpenDialogPainScale,
}: Props) {
  const queryClient = useQueryClient();
  const { enableItem } = useContext(DisablePagesContext);

  // **Define Query Keys**
  const STRETCH_PROGRESS_KEY = ["stretchProgress"];
  const TOTAL_REPETITION_KEY = ["totalRepetition"];

  // **React Query: Fetching stretchProgress**
  let { data: cachedProgress = 0 } = useQuery({
    queryKey: STRETCH_PROGRESS_KEY,
    queryFn: () => 0,
    staleTime: Infinity,
    initialData: 0,
  });

  // **React Query: Mutation to Update stretchProgress**
  const updateProgress = useMutation({
    mutationFn: (newProgress: number) => Promise.resolve(newProgress),
    onSuccess: (newProgress) => {
      queryClient.setQueryData(STRETCH_PROGRESS_KEY, newProgress);
    },
  });

  // **React Query: Fetching totalRepetition**
  const { data: totalRepetition = 0 } = useQuery({
    queryKey: TOTAL_REPETITION_KEY,
    queryFn: () => 0,
    staleTime: Infinity,
    initialData: 0,
  });

  // **React Query: Mutation to Update totalRepetition**
  const updateTotalRepetition = useMutation({
    mutationFn: (newTotal: number) => Promise.resolve(newTotal),
    onSuccess: (newTotal) => {
      queryClient.setQueryData(TOTAL_REPETITION_KEY, newTotal);
    },
  });

  // **Calculate Total Stretch**
  const totalStretch = useMemo(() => {
    console.log(planData);
    if (!planData?.plan) return 1;
    return planData.plan.reduce((total: number, exercise: any) => {
      return total + (exercise?.repetitions || 0);
    }, 0);
  }, [planData]);

  // **Effect: Update stretchProgress based on AutoState and Mode**
  useEffect(() => {
    if (stm32Data?.AutoState === "Resting") {
      updateProgress.mutate(cachedProgress + 1);
    }
    if (stm32Data?.AutoState === "Stop" || stm32Data?.Mode === "Error") {
      updateProgress.mutate(0);
    }
  }, [stm32Data?.AutoState, stm32Data?.Mode]);

  // **Effect: Update repetitionProgress and handle Pain Scale Dialog**
  useEffect(() => {
    if (stm32Data?.Repetitions !== undefined) {
      // Open pain scale dialog if repetitions are complete
      if (cachedProgress >= totalStretch) {
        setOpenDialogPainScale(true);
        updateProgress.mutate(0); // Reset progress after completion
        ["Dashboard", "Network", "Planning", "Activity", "Manual"].forEach(
          enableItem,
        );
      }
    }
  }, [stm32Data?.Repetitions]);

  // **Effect: Set Total Repetitions for Current Exercise**
  useEffect(() => {
    if (planData && stm32Data?.ExerciseIdx !== undefined) {
      const currentExercise = planData.plan[stm32Data.ExerciseIdx];
      const repetitions = currentExercise?.repetitions || 0;
      updateTotalRepetition.mutate(repetitions);
    }
  }, [planData, stm32Data?.ExerciseIdx]);

  return (
    <Grid
      sx={{
        flexDirection: "column",
        display: "flex",
        justifyContent: "center",
        alignContent: "center",
      }}
      container
    >
      <Grid
        item
        xs={6}
        sx={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}
      >
        <CircularProgressWithLabel
          value={totalStretch > 0 ? (cachedProgress / totalStretch) * 100 : 0}
        />
      </Grid>
      <Grid item sx={{ alignContent: "center" }} xs={6}>
        <Typography
          color="black"
          justifyContent="center"
          display="flex"
          marginBottom="4px"
          fontSize="20px"
        >
          {stm32Data?.Repetitions + "/" + totalRepetition}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "4px",
          }}
        >
          <Box sx={{ width: "75%" }}>
            <LinearProgress
              color="success"
              variant="determinate"
              value={
                totalRepetition > 0
                  ? (stm32Data?.Repetitions / totalRepetition) * 100
                  : 0
              }
            />
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}
