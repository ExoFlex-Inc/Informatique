import express from "express";
import multer from "multer";
import {
  getUserProfile,
  updateUserProfile,
  downloadAvatar,
  uploadAvatar,
  getAdmins,
} from "../controllers/userController.ts";

const router = express.Router();
const upload = multer();

router.get("/admin", getAdmins);
router.get("/:userId", getUserProfile);
router.put("/:userId", updateUserProfile);
router.get("/avatar/:userId", downloadAvatar);
router.post("/avatar/:userId", upload.single("avatar"), uploadAvatar);

export default router;
