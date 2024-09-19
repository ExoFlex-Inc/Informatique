import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminProfile() {
    // const queryClient = useQueryClient();
  
    const {
      data: admins,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["admin"],
      queryFn: async () => {
  
        // Fetch the profile data
        const adminResponse = await fetch(
          `http://localhost:3001/user/admin`,
        );
        if (!adminResponse.ok) {
          throw new Error(
            `Error fetching user profile: ${adminResponse.statusText}`,
          );
        }
        const adminData = await adminResponse.json();
    
        return adminData.admins;
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