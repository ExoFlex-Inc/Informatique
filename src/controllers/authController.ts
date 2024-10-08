import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import supaClient from "../utils/supabaseClient.ts";
import { validationResult } from "express-validator";
import { CookieOptions } from "express";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
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
            permissions: permissions,
          },
        },
      });

    if (authInsertError) {
      return res.status(400).json({ error: authInsertError.message });
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

    return res.status(201).json({ user: newUserProfile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: info.message });
    }

    try {
      const { email, password } = req.body;

      const { data: supabaseUser, error } =
        await supaClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      return res
        .status(200)
        .json({ session: supabaseUser.session, user: supabaseUser.user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })(req, res, next);
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

    return res.status(200).json({ logout: true });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supaClient.auth.getSession();

    if (error || !data?.session) {
      const refreshToken = req.cookies["refresh_token"];

      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token available" });
      }

      // Use fetch to refresh the session
      const response = await fetch(
        `${process.env.SUPABASE_API_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_ANON_KEY,
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
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60, // 1 hour
        });

        res.cookie("refresh_token", tokenData.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
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

        return res.status(200).json({ session: sessionData.session });
      } else {
        return res.status(401).json({
          error: "Unable to refresh session",
          details: tokenData.error_description || tokenData.error,
        });
      }
    }

    return res.status(200).json({ session: data.session });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const setSession = async (req: Request, res: Response) => {
  try {
    // Assuming you receive accessToken and refreshToken from the client
    const { accessToken, refreshToken } = req.body;

    if (!accessToken || !refreshToken) {
      return res.status(400).json({ error: "Missing tokens" });
    }

    // Set the session using Supabase client
    const { data, error } = await supaClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return res
        .status(401)
        .json({ error: "Unable to set session", details: error?.message });
    }

    // Update cookies with new tokens
    res.cookie("access_token", data.session.access_token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60, // 1 hour
    });

    res.cookie("refresh_token", data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return res.status(200).json({ session: data.session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
