import express from "express";
import {
  shareToCommunity,
  unshareFromCommunity,
  getCommunityFeed,
  handleReaction,
  removeReaction,
  addComment,
  getComments,
} from "../controllers/communityController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// All community routes require authentication
router.use(protect);

// Feed & Sharing
router.get("/feed", getCommunityFeed); // GET    /api/community/feed
router.post("/share/:entryId", shareToCommunity); // POST   /api/community/share/:entryId
router.delete("/share/:entryId", unshareFromCommunity); // DELETE /api/community/share/:entryId

// Reactions
router.post("/reaction/:entryId", handleReaction); // POST   /api/community/reaction/:entryId
router.delete("/reaction/:entryId", removeReaction); // DELETE /api/community/reaction/:entryId

// Comments
router.get("/comments/:entryId", getComments); // GET    /api/community/comments/:entryId
router.post("/comment/:entryId", addComment); // POST   /api/community/comment/:entryId

export default router;
