import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

/**
 * protect middleware
 * Verifies the Authorization: Bearer <token> header.
 * On success, attaches `req.user` (safe user object) and calls next().
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Not authorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1. Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Fetch fresh user from DB (ensures deleted/banned users can't use old tokens)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        isVerified: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    // 3. Attach user to request so downstream handlers can use it
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};
