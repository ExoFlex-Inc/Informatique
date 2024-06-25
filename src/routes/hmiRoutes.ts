import express from "express";
import { handleButtonClick } from "../controllers/hmiController.ts";

const router = express.Router();

router.post("/hmi-button-click", handleButtonClick);

export default router;
