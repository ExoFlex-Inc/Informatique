import express from "express";
import {
  removeRelation,
  fetchRelation,
  postRelation,
} from "../controllers/relationsController.ts";

const router = express.Router();

router.get("/:userId", fetchRelation);

router.post("/", postRelation);

router.delete("/:relationId", removeRelation);

export default router;
