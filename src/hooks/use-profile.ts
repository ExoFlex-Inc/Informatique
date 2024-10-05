import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "../hooks/use-session.ts";

export function useUserProfile() {
  const queryClient = useQueryClient();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const {
    data: profile,
    isLoading,
    fetchStatus,
    isFetching,
    isError,
    isSuccess,
    error,
    isStale,
    refetch,
    failureCount,
    status,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("No userId available");
      }

      // Fetch the profile data
      const profileResponse = await fetch(
        `http://localhost:3001/user/${userId}`,
      );
      if (!profileResponse.ok) {
        throw new Error(
          `Error fetching user profile: ${profileResponse.statusText}`,
        );
      }
      const profileData = await profileResponse.json();

      // Fetch the avatar if it exists
      if (profileData.avatar_url) {
        const avatarResponse = await fetch(
          `http://localhost:3001/user/avatar/${userId}?path=${encodeURIComponent(
            profileData.avatar_url,
          )}`,
        );
        if (avatarResponse.ok) {
          const avatarBlob = await avatarResponse.blob();
          const avatarBlobUrl = URL.createObjectURL(avatarBlob);
          profileData.avatar_blob_url = avatarBlobUrl;
        }
      }

      return profileData;
    },
    enabled: !!userId, // Only run the query if userId is available
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // Cache the data for 10 minutes
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff up to 30 seconds
    refetchOnWindowFocus: true, // Refetch data when the window is refocused
    refetchOnReconnect: true, // Refetch when the user reconnects
    onError: (error) => {
      console.error("Error fetching profile:", error.message);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      if (!userId) {
        throw new Error("No userId available");
      }

      const response = await fetch(`http://localhost:3001/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        throw new Error(`Error updating user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(
        ["userProfile", updatedProfile.user_id],
        updatedProfile,
      );
      queryClient.invalidateQueries(["userProfile", updatedProfile.user_id]);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) {
        throw new Error("No userId available");
      }

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(
        `http://localhost:3001/user/avatar/${userId}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error uploading avatar image: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.avatar_url;
    },
    onSuccess: (avatarUrl) => {
      if (profile) {
        queryClient.setQueryData(["userProfile", userId], {
          ...profile,
          avatar_url: avatarUrl,
        });
        queryClient.invalidateQueries(["userProfile", userId]);
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

  const uploadAvatar = (file: File) => {
    uploadAvatarMutation.mutate(file);
  };

  return {
    profile,
    isLoading,
    fetchStatus,
    isFetching,
    isSuccess,
    isError,
    error,
    status,
    isStale,
    updateProfile,
    setUserProfile,
    uploadAvatar,
    refetch,
    dataUpdatedAt,
    failureCount,
  };
}