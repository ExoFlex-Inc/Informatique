import express from "express";
import { setupLocalServer } from "../controllers/localServerController.ts";

const router = express.Router();

router.post("/setup-local-server", setupLocalServer);

export default router;
