import express from "express";
import { getUser } from "../controllers/userController.ts";

const router = express.Router();

router.get("/user", getUser);

export default router;
