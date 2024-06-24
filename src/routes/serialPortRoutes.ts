import express from "express";
import { initializeSerialPort } from "../controllers/serialPortController.ts";

const router = express.Router();

router.post("/initialize-serial-port", initializeSerialPort);

export default router;
