import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminProfile() {
  const {
    data: admins,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      // Fetch the profile data
      const adminResponse = await fetch(`http://localhost:3001/user/admin`, {
        method: "GET",
        credentials: "include",
      });

      if (!adminResponse.ok) {
        throw new Error(
          `Error fetching user profile: ${adminResponse.statusText}`,
        );
      }

      // Log the response data to check its structure
      const adminData = await adminResponse.json();
      console.log("Admin data response:", adminData); // Add this log

      return adminData.admins; // Ensure that `admins` exists in `adminData`
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    admins,
    isLoading,
    error,
  };
}
