import type { Request, Response } from "express";
import supaClient from "../utils/supabaseClient.ts";

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = req.params["userId"];

  if (!userId) {
    return res.status(400).json({ error: "No userId provided" });
  }

  const { data, error } = await supaClient
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: `Error fetching user profile: ${error.message}` });
  }

  return res.status(200).json(data);
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const userId = req.params["userId"];
  const newProfile = req.body;
  const { avatar_blob_url, ...profileToUpdate } = newProfile;

  const { error: authError } = await supaClient.auth.updateUser({
    data: {
      first_name: newProfile.first_name,
      last_name: newProfile.last_name,
      speciality: newProfile.speciality,
      permissions: newProfile.permissions,
      avatar_url: newProfile.avatar_url,
      fcm_token: newProfile.fcm_token,
    },
  });

  if (authError) {
    return res.status(500).json({
      error: `Error updating user authentication data: ${authError.message}`,
    });
  }

  const { data: profileData, error: profileError } = await supaClient
    .from("user_profiles")
    .update(profileToUpdate)
    .eq("user_id", userId)
    .select("*");

  if (profileError) {
    return res
      .status(500)
      .json({ error: `Error updating user profile: ${profileError.message}` });
  }

  return res.status(200).json(profileData);
};

export const getAdmins = async (_: Request, res: Response) => {
  try {
    const { data, error } = await supaClient
      .from("user_profiles")
      .select("*")
      .eq("permissions", "admin");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ admins: data });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
};

async function deleteOldImage(path: string | null) {
  if (path) {
    const { error: deleteError } = await supaClient.storage
      .from("avatars")
      .remove([path]);
    if (deleteError) {
      throw new Error(`Error deleting old avatar: ${deleteError.message}`);
    }
  }
}

export const downloadAvatar = async (req: Request, res: Response) => {
  const userId = req.params["userId"];
  const path = req.query["path"] as string;

  if (!userId || !path) {
    return res.status(400).json({ error: "No userId or path provided" });
  }

  const { data, error } = await supaClient.storage
    .from("avatars")
    .download(path);

  if (error) {
    return res
      .status(500)
      .json({ error: `Error downloading avatar: ${error.message}` });
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  const imageName = path.split("/").pop();
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Content-Disposition", `attachment; filename=${imageName}`);

  res.status(200).send(buffer);
};

export const uploadAvatar = async (req: Request, res: Response) => {
    const userId = req.params["userId"];

    if (!userId) {
      return res.status(400).json({ error: "No userId provided" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data: profile, error: profileError } = await supaClient
      .from("user_profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      return res.status(500).json({
        error: `Error fetching user profile: ${profileError.message}`,
      });
    }

    await deleteOldImage(profile?.avatar_url);

    const { data: avatarUrl, error: uploadError } = await supaClient.storage
      .from("avatars")
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) {
      return res
        .status(500)
        .json({ error: `Error uploading avatar: ${uploadError.message}` });
    }

    const { error: updateError } = await supaClient
      .from("user_profiles")
      .update({ avatar_url: filePath })
      .eq("user_id", userId);

    if (updateError) {
      return res
        .status(500)
        .json({ error: `Error updating user profile: ${updateError.message}` });
    }

    res.status(200).json({ avatar_url: avatarUrl.path });
  };
