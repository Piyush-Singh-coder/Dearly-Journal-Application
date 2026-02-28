/**
 * Frontend Socket.io Singleton
 *
 * Usage:
 *   import { getSocket, disconnectSocket } from "../lib/socket";
 *   const socket = getSocket(token);   // Pass JWT token on first call
 *   socket.emit("join-entry", id);
 *   disconnectSocket();               // Call on logout / app unmount
 */
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socket = null;

/** Returns the singleton socket, creating it if needed. */
export function getSocket(token, shareToken = null) {
  if (socket && socket.connected) return socket;

  if (socket) {
    // Already exists but disconnected — reconnect with updated auth
    socket.auth = { token, shareToken };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token, shareToken },
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket] Connect error:", err.message);
  });

  return socket;
}

/** Disconnect and clear the singleton (call on logout). */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
