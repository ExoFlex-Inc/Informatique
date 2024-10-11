// routes/exerciseDataRoute.js

import express from "express";
import {
  getExerciseData,
  postExerciseData,
} from "../controllers/exerciseDataController.js";

const router = express.Router();

router.get("/:userId", getExerciseData);
router.post("/:userId", postExerciseData);

export default router;
