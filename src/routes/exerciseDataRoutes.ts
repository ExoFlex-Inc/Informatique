// routes/exerciseDataRoute.js

import express from 'express';
import { getExerciseData } from '../controllers/exerciseDataController.js';

const router = express.Router();

router.get('/:userId', getExerciseData);

export default router;