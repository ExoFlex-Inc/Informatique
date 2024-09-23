import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "../hooks/use-session";
export interface UserProfile {
  first_name: string;
  last_name: string;
  speciality: string;
  user_id: string;
  permissions: string;
  avatar_url?: string;
  fcm_token?: string;
}

export function useUserProfile() {
  const queryClient = useQueryClient();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const {
    data: profile,
    isLoading,
    error,
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
          `http://localhost:3001/user/avatar/${userId}?path=${encodeURIComponent(profileData.avatar_url)}`,
        );
        if (avatarResponse.ok) {
          const avatarBlob = await avatarResponse.blob();
          const avatarBlobUrl = URL.createObjectURL(avatarBlob);
          profileData.avatar_blob_url = avatarBlobUrl;
        }
      }

      return profileData;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
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
      if (updatedProfile) {
        queryClient.setQueryData(
          ["userProfile", updatedProfile.user_id],
          updatedProfile,
        );
        queryClient.invalidateQueries(["userProfile", updatedProfile.user_id]);
      }
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
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
      if (profile) {
        queryClient.setQueryData(["userProfile", userId], {
          ...profile,
          avatar_url: avatarUrl,
        });
        queryClient.invalidateQueries(["userProfile", userId]);
      }
    },
    onError: (error: any) => {
      console.error("Error uploading avatar image:", error.message);
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
    error,
    updateProfile,
    setUserProfile,
    uploadAvatar,
  };
}
