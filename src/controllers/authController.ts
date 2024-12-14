import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import supaClient from "../utils/supabaseClient.ts";
import { validationResult } from "express-validator";

const cookieOptions = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: process.env["NODE_ENV"] === "production" ? "strict" : "lax",
  path: "/",
};

export const signup = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, first_name, last_name, phone_number, permissions } =
    req.body;

  try {
    // Check if the user already exists
    const { data: existingUser } = await supaClient
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Sign up the user in Supabase Auth
    const { data: newUserProfile, error: authInsertError } =
      await supaClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: first_name,
            last_name: last_name,
            phone_number: phone_number,
          },
        },
      });

    if (authInsertError) {
      return res.status(400).json({ error: authInsertError.message });
    }

    if (!newUserProfile.user) {
      return res.status(400).json({ error: "User profile creation failed." });
    }
    const newUserUUID = newUserProfile.user.id;

    // Insert user profile in the database
    const { error: profileInsertError } = await supaClient
      .from("user_profiles")
      .insert([
        {
          user_id: newUserUUID,
          first_name: first_name,
          last_name: last_name,
          phone_number: phone_number,
          permissions: permissions,
          email: email,
          password: hashedPassword,
        },
      ])
      .single();

    if (profileInsertError) {
      return res.status(400).json({ error: profileInsertError.message });
    }

    // Insert default stats for the new user
    const { error: statsInsertError } = await supaClient.from("stats").insert([
      {
        user_id: newUserUUID,
        current_streak: 0,
        longest_streak: 0,
      },
    ]);

    if (statsInsertError) {
      return res.status(400).json({ error: statsInsertError.message });
    }

    // Set the access_token and refresh_token in cookies if session exists
    if (newUserProfile.session) {
      res.cookie("access_token", newUserProfile.session.access_token, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60, // 1 hour
      });

      res.cookie("refresh_token", newUserProfile.session.refresh_token, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      });

      // Return user data
      return res.status(201).json({ user: newUserProfile.user });
    } else {
      // If no session, return user data without tokens
      return res.status(201).json({ user: newUserProfile.user });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const { data: supabaseUser, error } =
      await supaClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (error || !supabaseUser.session) {
      return res
        .status(401)
        .json({ error: error ? error.message : "Login failed" });
    }

    // Set the access_token and refresh_token in cookies
    res.cookie("access_token", supabaseUser.session.access_token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60, // 1 hour
    });

    res.cookie("refresh_token", supabaseUser.session.refresh_token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    // Return user data
    return res.status(200).json({ user: supabaseUser.user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { error: updateError } = await supaClient
      .from("user_profiles")
      .update({ fcm_token: null })
      .eq("user_id", user_id);

    if (updateError) {
      return res
        .status(500)
        .json({ error: `Failed to remove FCM token: ${updateError.message}` });
    }

    const { error } = await supaClient.auth.signOut();
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Clear cookies
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });

    // Return success response
    return res.status(200).json({ logout: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const setSession = async (req: Request, res: Response) => {
  try {
    const { data } = await supaClient.auth.getSession();

    if (data?.session) {
      // Session is active
      return res.status(200).json({
        user: data.session.user,
        message: "Session is active",
      });
    }

    // Attempt to refresh session
    const refreshToken = req.cookies["refresh_token"];

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token available" });
    }

    // Use fetch to refresh the session
    const response = await fetch(
      `${process.env["SUPABASE_API_URL"]}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env["SUPABASE_ANON_KEY"],
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      },
    );

    const tokenData = await response.json();

    if (tokenData.access_token) {
      // Set the new tokens in cookies
      res.cookie("access_token", tokenData.access_token, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60, // 1 hour
      });

      res.cookie("refresh_token", tokenData.refresh_token, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      });

      // Set the session using Supabase client
      const { data: sessionData, error: sessionError } =
        await supaClient.auth.setSession({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        });

      if (sessionError || !sessionData.session) {
        return res.status(401).json({
          error: "Unable to set session",
          details: sessionError?.message,
        });
      }

      // Return session and user data
      return res.status(200).json({
        user: sessionData.session.user,
        message: "Session refreshed successfully",
      });
    } else {
      return res.status(401).json({
        error: "Unable to refresh session",
        details: tokenData.error_description || tokenData.error,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getSession = async (_: Request, res: Response) => {
  try {
    const { data, error } = await supaClient.auth.getSession();

    if (error || !data?.session) {
      // If there's an error or no active session, return a 401 response
      return res
        .status(401)
        .json({ error: error?.message || "No user session" });
    }

    // Return session and user data
    return res.status(200).json({ user: data.session.user });
  } catch (err: any) {
    // Catch any unexpected errors and return a 500 response
    return res.status(500).json({ error: err.message });
  }
};
