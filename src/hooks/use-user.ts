import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import supaClient from "../utils/supabaseClient.ts";

export interface UserProfile {
  user_id: string;                // Unique user ID from Supabase
  first_name: string;             // First name from user metadata
  last_name: string;              // Last name from user metadata
  speciality?: string;            // Optional speciality field from user metadata
  permissions?: string[];         // Optional permissions array from user metadata
  fcm_token?: string | null;      // Optional FCM token, if applicable
  avatar_url?: string;            // Optional avatar URL for the user
  avatar_blob_url?: string;       // Optional local URL for the avatar blob
}

export function useUser() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isStale,
    isFetching,
    isError,
    error,
    refetch,
    failureCount,
    status,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3001/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        return Promise.reject({
          name: "FetchError",
          message: `Error fetching session: ${response.status} ${errorText}`,
        });
      }

      const data = await response.json();
      const session_status = data.session_status;

      if (data.user) {
        // Fetch the profile data
        const profileResponse = await fetch(
          `http://localhost:3001/user/${data.user.id}`,
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
            `http://localhost:3001/user/avatar/${data.user.id}?path=${encodeURIComponent(
              profileData.avatar_url,
            )}`,
          );
          if (avatarResponse.ok) {
            const avatarBlob = await avatarResponse.blob();
            const avatarBlobUrl = URL.createObjectURL(avatarBlob);
            if (avatarBlobUrl) {
              profileData.avatar_blob_url = avatarBlobUrl;
            }
          }
        }
        return { session_status, ...profileData };
      }

      return data.session_status;
    },
    retry: false,
    // retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
    staleTime: 1000 * 60 * 55, // 55 minutes
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const userId = user?.id;

  const updateProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      if (!newProfile.user_id) {
        throw new Error("No userId available");
      }

      const response = await fetch(`http://localhost:3001/user/${newProfile.user_id}`, {
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
      queryClient.setQueryData(["user"], {
        ...user,
        ...updatedProfile,
      });
      queryClient.invalidateQueries(["user"]);
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
        throw new Error(`Error uploading avatar image: ${response.statusText}`);
      }

      const data = await response.json();
      return data.avatar_url;
    },
    onSuccess: (avatarUrl) => {
      if (user) {
        queryClient.setQueryData(["user"], {
          ...user,
          avatar_url: avatarUrl,
        });
        queryClient.invalidateQueries(["user"]);
      }
    },
  });

  const updateProfile = (newProfile: UserProfile) => {
    updateProfileMutation.mutate(newProfile);
  };

  const uploadAvatar = (file: File) => {
    uploadAvatarMutation.mutate(file);
  };

  useEffect(() => {
    const { data: authListener } = supaClient.auth.onAuthStateChange(async (event, _) => {
      if (!user) {
        queryClient.invalidateQueries(["user"]);
      }
    });
  
    // Cleanup the listener on component unmount
    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, [queryClient]);

  return {
    user,
    isLoading,
    isStale,
    isFetching,
    isError,
    error,
    refetch,
    failureCount,
    status,
    updateProfile,
    uploadAvatar,
  };
}