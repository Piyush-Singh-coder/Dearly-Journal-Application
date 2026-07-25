import jwt from "jsonwebtoken";

export const generateToken = (userId, email) => {
  const secret = process.env.JWT_SECRET || "dearly_default_jwt_secret_key_2026";
  return jwt.sign({ userId, email }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
