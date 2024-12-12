import express from "express";
import { postPlan, getPlan, updatePlan } from "../controllers/planController.ts";

const router = express.Router();

router.post("/", postPlan);
router.get("/:userId", getPlan);
router.put("/", updatePlan);

export default router;
