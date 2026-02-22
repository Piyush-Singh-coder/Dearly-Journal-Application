import { Server } from "socket.io";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a specific journal entry room for collaboration
    socket.on("join-entry", (entryId) => {
      socket.join(entryId);
      console.log(`Socket ${socket.id} joined entry: ${entryId}`);
    });

    // Leave a specific journal entry room
    socket.on("leave-entry", (entryId) => {
      socket.leave(entryId);
      console.log(`Socket ${socket.id} left entry: ${entryId}`);
    });

    // Handle cursor movement
    socket.on("cursor-move", ({ entryId, cursorData }) => {
      // Broadcast to everyone else in the same entry room
      // cursorData expects: { userId, fullName, color, x, y }
      socket.to(entryId).emit("cursor-update", {
        socketId: socket.id,
        ...cursorData,
      });
    });

    // Handle disconnection to remove stray cursors
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // Let all rooms know this socket disconnected so they can remove the cursor
      socket.broadcast.emit("cursor-remove", socket.id);
    });
  });

  return io;
};
