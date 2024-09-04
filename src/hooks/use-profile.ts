import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "../hooks/use-session";
import { useEffect } from "react";

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

      const response = await fetch(`http://localhost:3001/user/${userId}`);

      if (!response.ok) {
        throw new Error(`Error fetching user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
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
      }
    },
  });
  
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
  
      const response = await fetch(`http://localhost:3001/user/avatar/${userId}`, {
        method: 'POST',
        body: formData,
      });
  
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
      }
    },
    onError: (error: any) => {
      console.error("Error uploading avatar image:", error.message);
    },
  });

  const downloadAvatarMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch(`http://localhost:3001/user/avatar/${userId}?path=${encodeURIComponent(path)}`);

      if (!response.ok) {
        throw new Error(`Error downloading avatar image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (url, variables) => {
      queryClient.setQueryData(["avatarUrl", variables], url);
      if (profile) {
        queryClient.setQueryData(["userProfile", userId], {
          ...profile,
          avatar_url: url,
        });
      }
    },
    onError: (error: any) => {
      console.error("Error downloading avatar image:", error.message);
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

  const downloadAvatar = (path: string) => {
    downloadAvatarMutation.mutate(path);
  };

  useEffect(() => {
    if (profile?.avatar_url) {
      downloadAvatar(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    setUserProfile,
    uploadAvatar,
    downloadAvatar,
  };
}