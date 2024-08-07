import { useState, useEffect } from "react";
import { supaClient } from "./supa-client.ts";
import { User } from "@supabase/supabase-js";
import { useAvatarContext } from "../context/avatarContext.tsx";

interface AvatarInfo {
  uploadImage: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  downloadImage: (path: string | undefined) => Promise<void>;
}

export function useAvatar(): AvatarInfo {
  const [avatarFile, setAvatarFile] = useState("");
  const { avatarUrl, setAvatarUrl } = useAvatarContext();
  const [profileUser, setProfileUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const {
          data: { user },
        } = await supaClient.auth.getUser();

        if (!user) {
          console.error("Forbidden");
        }

        setProfileUser(user);

        const { data: profile, error } = await supaClient
          .from("user_profiles")
          .select("*")
          .eq("user_id", user?.id);

        if (!profile || error) {
          throw new Error("Profile not found");
        }

        if (avatarFile) {
          setAvatarFile(`${profile[0].avatar_url}`);
        }
      } catch (error) {
        console.log("Error retrieving user profile:", error);
      }
    }
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (avatarFile) {
      downloadImage(avatarFile);
    }
  }, [avatarFile]);

  const downloadImage = async (path: string | undefined) => {
    try {
      if (path) {
        const { data, error } = await supaClient.storage
          .from("avatars")
          .download(path);
        if (error) {
          throw error;
        } else {
          const url = URL.createObjectURL(data);
          setAvatarUrl(url);
        }
      } else {
        setAvatarUrl(null);
      }
    } catch (error: any) {
      console.error("Error downloading image: ", error.message);
    }
  };

  const deleteOldImage = async () => {
    if (avatarFile) {
      const { error: uploadError } = await supaClient.storage
        .from("avatars")
        .remove([avatarFile]);
      if (uploadError) {
        throw uploadError;
      }
    }
  };

  const uploadImage = async (event: any) => {
    deleteOldImage();
    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supaClient.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { error: updateError } = await supaClient
      .from("user_profiles")
      .update({ avatar_url: filePath })
      .eq("user_id", profileUser?.id);

    if (updateError) {
      throw updateError;
    }
    setAvatarFile(filePath);
  };

  return { uploadImage, downloadImage };
}
