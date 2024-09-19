import express from "express";
import {
  getNotifications,
  createNotification,
  deleteNotification,
} from "../controllers/notificationController.ts";

const router = express.Router();

router.get("/:userId", getNotifications);

router.post("/", createNotification);

router.delete("/:notificationId", deleteNotification);

export default router;