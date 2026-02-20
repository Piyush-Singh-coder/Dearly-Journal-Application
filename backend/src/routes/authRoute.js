import express from "express";
import {
  register,
  login,
  logout,
  profile,
  verifyEmail,
  googleAuth,
} from "../controllers/authController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/google", googleAuth);

// Protected routes (require valid JWT)
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);

export default router;
