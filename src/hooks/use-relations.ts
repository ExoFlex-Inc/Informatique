import { useMutation, useQuery } from "@tanstack/react-query";
import { useUser } from "./use-user.ts";

export function useRelations() {
  const { user } = useUser();

  const {
    data: relations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["relations", user?.user_id],
    queryFn: async () => {
      const responseRelations = await fetch(
        `http://localhost:3001/relations/${user.user_id}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!responseRelations.ok) {
        throw new Error(
          `Error fetching relations: ${responseRelations.statusText}`,
        );
      }

      const relationData = await responseRelations.json();
      console.log("Relations data response:", relationData);

      return relationData;
    },
    enabled: !!user?.user_id,
  });

  return {
    relations,
    isLoading,
    error,
  };
}

export function useFetchPendingRelations() {
  const { user } = useUser();

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pendingRelations"],
    queryFn: async () => {
      if (!user?.user_id) return [];
      const response = await fetch(
        `http://localhost:3001/relations/notifications/${user.user_id}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Error fetching notification");
      return await response.json();
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    enabled: !!user?.user_id,
  });

  return { notifications, isLoading, error };
}
