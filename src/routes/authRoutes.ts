import express from "express";
import { check } from "express-validator";
import {
  signup,
  login,
  logout,
  getSession,
} from "../controllers/authController.ts";

const router = express.Router();

router.post(
  "/signup",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  signup,
);

router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Enter a valid email address"),
    check("password").exists().withMessage("Password is required"),
  ],
  login,
);

router.post("/logout", logout);
router.get("/session", getSession);

export default router;
