import express from "express";
import { getAdminClientsList } from "../controllers/wellnessNetworkController.ts";
import { checkPermission } from "../middlewares/checkPermission.tsx";

const router = express.Router();

router.get(
  "/wellness_network",
  checkPermission(["dev", "admin"]),
  getAdminClientsList,
);

export default router;
