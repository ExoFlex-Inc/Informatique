import { useQuery, useQueryClient } from "@tanstack/react-query";
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
      const responseRelations = await fetch(`http://localhost:3001/relations/${profile.user_id}`, {
        method: "GET",
        credentials: "include",
      });

      if (!responseRelations.ok) {
        throw new Error(
          `Error fetching relations: ${responseRelations.statusText}`
        );
      }

      

      const relationData = await responseRelations.json();
      console.log("Relations data response:", relationData);

      return relationData;
    },
    enabled: !!profile?.user_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    relations,
    isLoading,
    error,
  };
}

