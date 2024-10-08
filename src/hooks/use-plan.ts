import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Movement {
  exercise: string;
  target_angle: number;
  target_torque: number;
}

export interface Plan {
  rest: number;
  repetitions: number;
  speed: number;
  time: number;
  movement: Movement[];
}

export interface Limits {
  left: {
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
  };
  right: {
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
  };
}

export interface PlanWithLimits {
  plan: Plan[];
  limits: Limits;
}

export function usePlan(userId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: planData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["plan", userId],
    queryFn: async () => {
      const responseGetPlanning = await fetch(
        `http://localhost:3001/plan/${userId}`,
      );

      if (!responseGetPlanning.ok) {
        if (responseGetPlanning.status === 404) {
          const cachedPlan = queryClient.getQueryData(["plan", userId]);

          if (cachedPlan) {
            return cachedPlan;
          }

          return {
            plan: [
              {
                rest: 0,
                speed: 0,
                repetitions: 0,
                time: 0,
                movement: [
                  {
                    exercise: "",
                    target_angle: 0,
                    target_torque: 0,
                  },
                ],
              },
            ],
            limits: {
              left: {
                torque: {
                  dorsiflexion: 0,
                  extension: 0,
                  eversion: 0,
                },
                angles: {
                  dorsiflexion: 0,
                  extension: 0,
                  eversion: 0,
                },
              },
              right: {
                torque: {
                  dorsiflexion: 0,
                  extension: 0,
                  eversion: 0,
                },
                angles: {
                  dorsiflexion: 0,
                  extension: 0,
                  eversion: 0,
                },
              },
            },
          };
        }
        throw new Error("Failed to fetch plan data");
      }

      const planData = await responseGetPlanning.json();
      return planData.plan;
    },
    enabled: !!userId,
  });

  const addSetMutation = useMutation({
    mutationFn: async (newSet: Plan) => {
      const previousPlan = queryClient.getQueryData<PlanWithLimits>([
        "plan",
        userId,
      ]);

      if (previousPlan) {
        queryClient.setQueryData(["plan", userId], {
          ...previousPlan,
          plan: [...previousPlan.plan, newSet],
        });
      }

      return Promise.resolve(newSet);
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (checkboxIndex: number[]) => {
      const previousPlan = queryClient.getQueryData<PlanWithLimits>([
        "plan",
        userId,
      ]);

      if (previousPlan) {
        const newPlan = [...previousPlan.plan];

        checkboxIndex.forEach((index) => {
          const item = newPlan[index];
          if (item && "movement" in item) {
            const setItem = item as Plan;

            setItem.movement = [
              ...setItem.movement,
              {
                exercise: "",
                target_angle: 0,
                target_torque: 0,
              },
            ];
          }
        });

        // Update the cache with the modified plan
        queryClient.setQueryData(["plan", userId], {
          ...previousPlan,
          plan: newPlan,
        });
      }

      return Promise.resolve(checkboxIndex);
    },
  });

  const addSetRestMutation = useMutation({
    mutationFn: async () => {
      const previousPlan = queryClient.getQueryData<PlanWithLimits>([
        "plan",
        userId,
      ]);

      if (previousPlan) {
        const newPlan = [
          ...previousPlan.plan,
          { rest: 0, speed: 0, repetitions: 0, time: 0, movement: [] },
        ];

        queryClient.setQueryData(["plan", userId], {
          ...previousPlan,
          plan: newPlan,
        });
      }

      return Promise.resolve();
    },
  });

  const setLimitLeftMutation = useMutation({
    mutationFn: async ({
      type,
      stretch,
      value,
    }: {
      type: string;
      stretch: string;
      value: number;
    }) => {
      const previousPlan = queryClient.getQueryData<PlanWithLimits>([
        "plan",
        userId,
      ]);

      if (previousPlan) {
        const prevLimits = previousPlan.limits;

        let newLimits;

        if (type === "torque") {
          newLimits = {
            ...prevLimits,
            left: {
              ...prevLimits.left,
              torque: {
                ...prevLimits.left.torque,
                [stretch]: value,
              },
            },
          };
        } else {
          newLimits = {
            ...prevLimits,
            left: {
              ...prevLimits.left,
              angles: {
                ...prevLimits.left.angles,
                [stretch]: value,
              },
            },
          };
        }

        queryClient.setQueryData(["plan", userId], {
          ...previousPlan,
          limits: newLimits,
        });
      }

      return Promise.resolve();
    },
  });

  const setLimitRightMutation = useMutation({
    mutationFn: async ({
      type,
      stretch,
      value,
    }: {
      type: string;
      stretch: string;
      value: number;
    }) => {
      const previousPlan = queryClient.getQueryData<PlanWithLimits>([
        "plan",
        userId,
      ]);

      if (previousPlan) {
        const prevLimits = previousPlan.limits;

        let newLimits;

        if (type === "torque") {
          newLimits = {
            ...prevLimits,
            right: {
              ...prevLimits.right,
              torque: {
                ...prevLimits.right.torque,
                [stretch]: value,
              },
            },
          };
        } else {
          newLimits = {
            ...prevLimits,
            right: {
              ...prevLimits.right,
              angles: {
                ...prevLimits.right.angles,
                [stretch]: value,
              },
            },
          };
        }

        queryClient.setQueryData(["plan", userId], {
          ...previousPlan,
          limits: newLimits,
        });
      }

      return Promise.resolve();
    },
  });
  const setPlanMutation = useMutation({
    mutationFn: async ({ plan }: { plan: PlanWithLimits }) => {
      queryClient.setQueryData(["plan", userId], plan);
      return Promise.resolve();
    },
  });

  const addSet = () => {
    addSetMutation.mutate({
      rest: 0,
      speed: 0,
      repetitions: 0,
      time: 0,
      movement: [
        {
          exercise: "",
          target_angle: 0,
          target_torque: 0,
        },
      ],
    });
  };

  const addExercise = (checkboxIndex: number[]) => {
    addExerciseMutation.mutate(checkboxIndex);
  };

  const addSetRest = () => {
    addSetRestMutation.mutate();
  };

  const setLimitLeft = (type: string, stretch: string, value: number) => {
    setLimitLeftMutation.mutate({ type, stretch, value });
  };

  const setLimitRight = (type: string, stretch: string, value: number) => {
    setLimitRightMutation.mutate({ type, stretch, value });
  };

  const setPlan = (plan: PlanWithLimits) => {
    setPlanMutation.mutate({ plan });
  };

  return {
    planData,
    isLoading,
    error,
    addSet,
    addExercise,
    addSetRest,
    setLimitLeft,
    setLimitRight,
    setPlan,
  };
}
