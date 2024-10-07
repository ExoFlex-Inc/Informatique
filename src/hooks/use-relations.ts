import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserProfile } from "../hooks/use-profile.ts";

export function useRelations() {
  const { profile } = useUserProfile();

  const {
    data: relations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["relations", profile?.user_id],
    queryFn: async () => {
      const responseRelations = await fetch(
        `http://localhost:3001/relations/${profile.user_id}`,
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
    enabled: !!profile?.user_id,
  });

  return {
    relations,
    isLoading,
    error,
  };
}

export function useFetchPendingRelations() {
  const { profile } = useUserProfile();

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pendingRelations"],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const response = await fetch(
        `http://localhost:3001/relations/notifications/${profile.user_id}`,
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
    enabled: !!profile?.user_id,
  });

  return { notifications, isLoading, error };
}
