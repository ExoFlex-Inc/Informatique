import express from "express";
import multer from "multer";
import { getUserProfile, updateUserProfile, downloadAvatar, uploadAvatar } from "../controllers/userController";

const router = express.Router();
const upload = multer();

router.get("/:userId", getUserProfile);
router.put("/:userId", updateUserProfile);
router.get("/avatar/:userId", downloadAvatar);
router.post("/avatar/:userId", upload.single('avatar'), uploadAvatar);

export default router;