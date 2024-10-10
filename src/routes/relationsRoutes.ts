import express from "express";
import {
  removeRelation,
  fetchRelation,
  postRelation,
  getPendingAdminNotifications,
} from "../controllers/relationsController.ts";

const router = express.Router();

router.get("/:userId", fetchRelation);

router.post("/", postRelation);

router.delete("/:relationId", removeRelation);

router.get("/notifications/:userId", getPendingAdminNotifications);

export default router;
