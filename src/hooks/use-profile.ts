import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supaClient } from "../hooks/supa-client";
import { useSupabaseSession } from "../hooks/use-session";

export interface UserProfile {
  first_name: string;
  last_name: string;
  speciality: string;
  user_id: string;
  permissions: string;
  avatar_url?: string;
}

export function useUserProfile() {
  const queryClient = useQueryClient();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("No userId available");
      }

      const { data, error } = await supaClient
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        throw new Error("Error fetching user profile");
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      const { data: authData, error: authError } = await supaClient.auth.updateUser({
        data: {
          first_name: newProfile.first_name,
          last_name: newProfile.last_name,
          speciality: newProfile.speciality,
          permissions: newProfile.permissions,
          avatar_url: newProfile.avatar_url,
        },
      });
  
      if (authError) {
        throw new Error("Error updating user authentication data");
      }
  
      const { data: profileData, error: profileError } = await supaClient
        .from("user_profiles")
        .update(newProfile)
        .eq("user_id", newProfile.user_id)
        .select("*");
  
      if (profileError) {
        throw new Error("Error updating user profile in the database");
      }
  
      return profileData;
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile && updatedProfile.length > 0) {
        queryClient.setQueryData(["userProfile", updatedProfile[0].user_id], updatedProfile[0]);
      }
    },
  });

  const updateProfile = (newProfile: UserProfile) => {
    updateProfileMutation.mutate(newProfile);
  };

  const setUserProfile = (userProfile: UserProfile) => {
    if (userId) {
      queryClient.setQueryData(["userProfile", userId], userProfile);
    }
  };

  return { profile, isLoading, error, updateProfile, setUserProfile };
}