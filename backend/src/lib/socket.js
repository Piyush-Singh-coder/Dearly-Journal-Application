import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";

// Helper to check if a user can access a specific entry via membership OR share token
const checkEntryAccess = async (entryId, userId, shareToken = null) => {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    include: { notebook: { select: { id: true } } },
  });

  if (!entry) return false;
  if (entry.userId === userId) return true;

  // Check if they are a member of the notebook
  if (entry.notebookId) {
    const member = await prisma.journalMember.findUnique({
      where: { userId_notebookId: { userId, notebookId: entry.notebookId } },
    });
    if (member) return true;
  }

  // Allow access via share token (link-shared or community entries)
  if (
    shareToken &&
    entry.shareToken === shareToken &&
    (entry.shareMode === "link" || entry.shareMode === "community")
  ) {
    return true;
  }

  return false;
};

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.IO Middleware: Authenticate every connection
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication error: No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, fullName: true, email: true },
      });

      if (!user) return next(new Error("Authentication error: User not found"));

      socket.request.user = user; // Attach server-verified user info
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.request.user;
    console.log(
      `User connected: ${user.fullName || user.email} (${socket.id})`,
    );

    // Join a specific journal entry room for collaboration
    socket.on("join-entry", async (entryId) => {
      // shareToken may be sent by viewers who opened the entry via /share/:token
      const shareToken = socket.handshake.auth?.shareToken || null;
      const hasAccess = await checkEntryAccess(entryId, user.id, shareToken);
      if (!hasAccess) {
        return socket.emit("error", {
          message: "Access denied to this entry.",
        });
      }

      socket.join(entryId);
      console.log(`Socket ${socket.id} joined entry: ${entryId}`);

      // Tell others in the room about this new collaborator
      socket.to(entryId).emit("user-joined", {
        socketId: socket.id,
        userId: user.id,
        fullName: user.fullName || user.email,
      });
    });

    // Leave a specific journal entry room
    socket.on("leave-entry", (entryId) => {
      socket.leave(entryId);
      // Broadcast removal of cursor + mark user as left
      socket.to(entryId).emit("cursor-remove", socket.id);
      socket.to(entryId).emit("user-left", { socketId: socket.id });
      console.log(`Socket ${socket.id} left entry: ${entryId}`);
    });

    // ── Real-time content collaboration ─────────────────────────────────────
    // Client sends its new editor HTML; server fans it out to others in the room.
    socket.on("content-change", ({ entryId, html }) => {
      if (!socket.rooms.has(entryId)) return; // must be joined first
      if (typeof html !== "string") return; // basic sanity check

      // Relay to everyone else in the room (not back to the sender)
      socket.to(entryId).emit("content-update", {
        html,
        socketId: socket.id,
        userId: user.id,
      });
    });
    // ────────────────────────────────────────────────────────────────────────

    // Handle cursor movement
    socket.on("cursor-move", ({ entryId, cursorData }) => {
      // Must be in the room to send cursor data
      if (!socket.rooms.has(entryId)) return;

      // Broadcast using server-verified user identity, ignoring client claims
      socket.to(entryId).emit("cursor-update", {
        socketId: socket.id,
        userId: user.id,
        fullName: user.fullName || user.email,
        color: cursorData.color,
        x: cursorData.x,
        y: cursorData.y,
      });
    });

    // "disconnecting" fires right BEFORE the socket leaves its rooms
    socket.on("disconnecting", () => {
      // socket.rooms is a Set containing the socket's own ID and any rooms it joined
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          // Tell this specific room to remove this user's cursor
          socket.to(room).emit("cursor-remove", socket.id);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `User disconnected: ${user.fullName || user.email} (${socket.id})`,
      );
    });
  });

  return io;
};
