import bcrypt from "bcryptjs";
import crypto from "crypto"; // built-in Node module
import prisma from "../lib/prisma.js";
import supabase from "../lib/supabase.js";
import { sendVerificationEmail } from "../lib/mailer.js";
import { generateToken } from "../lib/utils.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }

  try {
    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Generate a secure email-verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 5. Create the user in the database
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        verificationToken,
        isVerified: false,
        // Auto-create default settings for the new user
        settings: {
          create: { theme: "light" },
        },
      },
      // Only return safe fields — never return passwordHash to the client
      select: {
        id: true,
        email: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // 6. Send verification email (fire-and-forget; don't block response)
    sendVerificationEmail(email, verificationToken).catch((err) =>
      console.error("Failed to send verification email:", err),
    );

    // 7. Issue JWT so the user is immediately logged in (but unverified)
    const token = generateToken(user.id, user.email);

    return res.status(201).json({
      message:
        "Account created! Please check your email to verify your account.",
      token,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=<verification_token>
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required." });
  }

  try {
    // Find user with this token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      // Token not found — could be already verified or invalid
      // Check if there's a verified user whose token was already cleared
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ message: "Your email is already verified! You can sign in." });
    }

    // Mark as verified and clear the token so it can't be reused
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login  (stub — implement next)
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Use a generic message — don't reveal whether the email exists
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // actually CHECK the result of bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // block login for unverified email accounts
    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox.",
      });
    }

    const token = generateToken(user.id, user.email);

    // never send passwordHash or verificationToken to the client
    const { passwordHash, verificationToken, ...safeUser } = user;

    return res
      .status(200)
      .json({ message: "Login successful", token, user: safeUser });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google
// Frontend sends the Supabase access_token after Google sign-in.
// Backend verifies it, upserts the user in our DB, issues our own JWT.
// ─────────────────────────────────────────────────────────────────────────────
export const googleAuth = async (req, res) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res
      .status(400)
      .json({ message: "Supabase access token is required." });
  }

  try {
    // 1. Verify the token with Supabase — get the authenticated user's profile
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !supabaseUser) {
      return res
        .status(401)
        .json({ message: "Invalid or expired Google token." });
    }

    const { id: googleId, email, user_metadata } = supabaseUser;
    const avatarUrl = user_metadata?.avatar_url || null;

    // 2. Upsert: find existing user or create a new one
    //    Use updateOrCreate pattern so returning Google users aren't duplicated
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (!user) {
      // First-time Google login → create user (pre-verified, no password needed)
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          avatarUrl,
          isVerified: true, // Google already verified their email
          passwordHash: null,
          settings: { create: { theme: "light" } },
        },
      });
    } else if (!user.googleId) {
      // Existing email/password user signs in with Google for the first time
      // → link their Google ID to the existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: avatarUrl || user.avatarUrl,
          isVerified: true,
        },
      });
    }

    // 3. Issue our own JWT (same format as email/password login)
    const token = generateToken(user.id, user.email);

    // Strip sensitive fields
    const { passwordHash, verificationToken, ...safeUser } = user;

    return res.status(200).json({
      message: "Google login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  (stub — implement next)
// ─────────────────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  // JWTs are stateless — the server holds no session to destroy.
  // The client simply discards the token (remove from localStorage / state).
  // If you later need server-side invalidation, implement a token blocklist here.
  return res.status(200).json({ message: "Logged out successfully." });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/profile  (stub — implement next)
// ─────────────────────────────────────────────────────────────────────────────
export const profile = async (req, res) => {
  // req.user is set by the `protect` middleware (already safe — no passwordHash)
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isVerified: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        settings: true, // Include theme, reminder prefs
        _count: {
          select: {
            entries: true, // Total journal entries
            notebooks: true, // Total notebooks
          },
        },
      },
    });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const { fullName, avatarUrl } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isVerified: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    });

    return res
      .status(200)
      .json({ user, message: "Profile updated successfully." });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/settings
// ─────────────────────────────────────────────────────────────────────────────
export const updateSettings = async (req, res) => {
  const { theme, dailyReminder } = req.body;

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: {
        ...(theme !== undefined && { theme }),
        ...(dailyReminder !== undefined && { dailyReminder }),
      },
      create: {
        userId: req.user.id,
        theme: theme || "light",
        dailyReminder: dailyReminder || null,
      },
    });

    return res
      .status(200)
      .json({ settings, message: "Settings updated successfully." });
  } catch (error) {
    console.error("Update settings error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "New password must be at least 8 characters." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Check if user has a password (might be a Google-only account)
    if (!user.passwordHash) {
      return res
        .status(400)
        .json({
          message:
            "This account uses Google Sign-In and does not have a password.",
        });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/auth/account
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
