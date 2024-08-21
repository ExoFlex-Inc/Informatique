import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { supaClient } from "../hooks/supa-client";
import { validationResult } from "express-validator";

export const signup = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, first_name, last_name, speciality, permissions } =
    req.body;

  try {
    // Check if the user already exists
    const { data: existingUser } = await supaClient
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists." });
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
            speciality: speciality,
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
          speciality: speciality,
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

      return res.status(200).json({ session: supabaseUser.session, user: supabaseUser.user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })(req, res, next);
};

export const logout = async (req: Request, res: Response) => {
  try {
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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ session: data.session });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const setSession = async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = req.body;

  try {
    const { data, error } = await supaClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ session: data.session });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};