import express from "express";
import {
  initializeSerialPort,
  recordingStm32Data,
  getSavedData,
  clearData,
} from "../controllers/stm32Controller.ts";

const router = express.Router();

router.post("/initialize-serial-port", initializeSerialPort);
router.post("/record", recordingStm32Data);
router.get("/saved-data", getSavedData);
router.post("/clear-data", clearData);

export default router;
