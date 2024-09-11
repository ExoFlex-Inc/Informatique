import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import supaClient from "../utils/supabaseClient.ts";

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const { data: user, error } = await supaClient
          .from("user_profiles")
          .select("*")
          .eq("email", email)
          .single();

        if (error || !user) {
          return done(null, false, { message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { data: user, error } = await supaClient
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return done(error, null);
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
