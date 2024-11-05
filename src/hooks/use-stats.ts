import { useQuery } from "@tanstack/react-query";
import { useUser } from "./use-user.ts";

export function useStats() {
  const { user } = useUser();

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stats", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) {
        throw new Error("User ID is missing");
      }

      const response = await fetch(
        `http://localhost:3001/stat/${user.user_id}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`Error fetching stats: ${response.statusText}`);
      }

      const statsData = await response.json();
      if (!statsData || statsData.length === 0) {
        throw new Error("No stats found for this user.");
      }

      return statsData[0];
    },
    enabled: !!user?.user_id,
  });

  return {
    stats,
    isLoading,
    error,
  };
}
