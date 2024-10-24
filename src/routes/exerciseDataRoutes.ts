import express from "express";
import {
  getExerciseData,
  getExerciseDataById,
  postExerciseData,
} from "../controllers/exerciseDataController.js";

const router = express.Router();

router.get("/dates/:userId", getExerciseData);
router.get("/:exerciseId", getExerciseDataById);
router.post("/:userId", postExerciseData);

export default router;
