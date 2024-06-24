import express from "express";
import { postPlan, getPlan } from "../controllers/planController.ts";
import { authenticateUser } from "../middlewares/authMiddleware.ts";

const router = express.Router();

router.post("/plan", authenticateUser, postPlan);
router.get("/plan", authenticateUser, getPlan);

export default router;
