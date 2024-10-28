import express from "express";
import {
    fetchStats,
    fetchTopUsersStats,
} from "../controllers/statController.ts";

const router = express.Router();

router.get("/top_users", fetchTopUsersStats);
router.get("/:userId", fetchStats);

export default router;