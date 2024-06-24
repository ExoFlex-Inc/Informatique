import express from "express";
import {
  pushPlanSupabase,
  getPlan,
} from "../controllers/supabaseController.ts";

import { checkSession } from "../middlewares/checkSession.ts";

const router = express.Router();

router.post("/push-plan-supabase", checkSession, pushPlanSupabase);
router.get("/get-plan", checkSession, getPlan);

export default router;
