import express from "express";
import {
  initializeSerialPort,
  recordingStm32Data,
  handleButtonClick,
} from "../controllers/stm32Controller.ts";

const router = express.Router();

router.post("/initialize-serial-port", initializeSerialPort);
router.post("/record", recordingStm32Data);
router.post("/button", handleButtonClick);

export default router;
