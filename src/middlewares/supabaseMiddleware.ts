// src/middlewares/supabaseMiddleware.ts

import supaClient from "../utils/supabaseClient.ts";
import { Request, Response, NextFunction } from "express";
import { CookieOptions } from "express";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

// Extend Express's Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to authenticate user based on access token from cookies.
 */
export const supabaseMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies["access_token"] || "";

  if (accessToken) {
    try {
      // Fetch user associated with the access token
      const { data, error } = await supaClient.auth.getUser(accessToken);

      if (error || !data.user) {
        console.error(
          "Authentication error:",
          error?.message || "No user found.",
        );

        res.clearCookie("access_token", cookieOptions);
        res.clearCookie("refresh_token", cookieOptions);
        return res
          .status(401)
          .json({ error: "Invalid or expired access token." });
      }

      // Attach user to request object
      req.user = data.user;
    } catch (err) {
      console.error("Middleware error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  next();
};
