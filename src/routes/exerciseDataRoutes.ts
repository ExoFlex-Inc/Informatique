import express from "express";
import {
  getExerciseData,
  getExerciseDataById
} from "../controllers/exerciseDataController.js";

const router = express.Router();

router.get("/dates/:userId", getExerciseData);
router.get("/:exerciseId", getExerciseDataById);

export default router;
