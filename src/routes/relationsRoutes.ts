import express from "express";
import {
  removeRelation,
  fetchRelation,
  postRelation,
  acceptRequest,
} from "../controllers/relationsController.ts";

const router = express.Router();

router.get("/:userId", fetchRelation);

router.post("/request", postRelation);

router.delete("/:relationId", removeRelation);

router.put("/accept/:relationId", acceptRequest);

export default router;