import express from "express";
import passport from "passport";
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { supaClient } from "../hooks/supa-client";

const router = express.Router();

router.post(
  "/signup",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name, speciality, permissions } =
      req.body;

    try {
      //TODO Remove this table when getUserWithEmail functionnality is added to supabase
      const { data: existingUser, error: existingUserError } = await supaClient
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

      const { data: newUser, error: profileInsertError } = await supaClient
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
  },
);

router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password").exists().withMessage("Password is required"),
  ],
  async (req, res, next) => {
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
  },
);

router.post("/logout", async (req, res) => {
  try {
    // const { error } = await supaClient.auth.signOut();

    // if (error) {
    //   return res.status(500).json({ error: error.message });
    // }

    return res.status(200).json({ logout: true });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

export default router;
