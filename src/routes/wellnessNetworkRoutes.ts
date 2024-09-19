import express from "express";
import { getUsersList } from "../controllers/wellnessNetworkController.ts";

const router = express.Router();

router.get("/wellness_network", getUsersList);

export default router;
