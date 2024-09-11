import express from "express";
import { postPlan, getPlan } from "../controllers/planController.ts";

const router = express.Router();

router.post("/plan", postPlan);
router.get("/plan", getPlan);

export default router;
