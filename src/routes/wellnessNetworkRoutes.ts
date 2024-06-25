import express from "express";
import {
  postAdminClientsList,
  getAdminClientsList,
} from "../controllers/wellnessNetworkController.ts";
import { checkPermission } from "../middlewares/checkPermission.tsx";

const router = express.Router();

router.post(
  "/wellness_network",
  checkPermission(["dev", "admin"]),
  postAdminClientsList,
);
router.get(
  "/wellness_network",
  checkPermission(["dev", "admin"]),
  getAdminClientsList,
);

export default router;
