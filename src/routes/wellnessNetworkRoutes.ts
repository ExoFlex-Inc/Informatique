import express from "express";
import { getAdminClientsList } from "../controllers/wellnessNetworkController.ts";

const router = express.Router();

router.get(
  "/wellness_network",
  getAdminClientsList,
);

export default router;
