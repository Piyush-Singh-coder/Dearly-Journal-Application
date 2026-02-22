import express from "express";
import {
  createNotebook,
  getNotebooks,
  getNotebookById,
  updateNotebook,
  deleteNotebook,
  inviteToNotebook,
  joinByInvite,
  removeMember,
} from "../controllers/notebookController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/", createNotebook); // POST   /api/notebooks
router.get("/", getNotebooks); // GET    /api/notebooks
router.get("/:id", getNotebookById); // GET    /api/notebooks/:id
router.put("/:id", updateNotebook); // PUT    /api/notebooks/:id
router.delete("/:id", deleteNotebook); // DELETE /api/notebooks/:id

// Collaboration
router.post("/:id/invite", inviteToNotebook); // POST   /api/notebooks/:id/invite
router.post("/join/:token", joinByInvite); // POST   /api/notebooks/join/:token
router.delete("/:id/members/:userId", removeMember); // DELETE /api/notebooks/:id/members/:userId

export default router;
