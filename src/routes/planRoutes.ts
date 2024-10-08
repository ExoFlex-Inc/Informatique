import express from "express";
import { postPlan, getPlan } from "../controllers/planController.ts";

const router = express.Router();

router.post("/", postPlan);
router.get("/:userId", getPlan);

export default router;
