import express from "express";
import {
  checkImageUpdate,
  executeImageUpdate,
} from "../controllers/dockerController.ts";

const router = express.Router();

router.get("/check-updates", checkImageUpdate);
router.post("/update", executeImageUpdate);

export default router;
