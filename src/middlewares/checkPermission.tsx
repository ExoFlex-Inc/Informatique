import { Request, Response, NextFunction } from "express";
import  supaClient  from "../utils/supabaseClient.ts";

export const checkPermission = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        data: { user },
      } = await supaClient.auth.getUser();

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Retrieve the user's permissions
      const { data: profile, error } = await supaClient
        .from("user_profiles")
        .select("permissions")
        .eq("user_id", user.id)
        .single();

      if (!profile || error) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const userPermissions = profile.permissions;
      const hasPermission = requiredPermissions.includes(userPermissions);

      if (hasPermission) {
        next();
      } else {
        res.status(403).json({ error: "Forbidden" });
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ error: "Error checking permissions" });
    }
  };
};
