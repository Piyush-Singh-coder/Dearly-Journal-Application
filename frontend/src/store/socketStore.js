/**
 * Zustand store for real-time collaboration state.
 * Tracks which users are currently editing the same entry.
 */
import { create } from "zustand";

// Map from socketId → { userId, fullName, color }
const COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#22c55e", // green
];

let colorIndex = 0;
const colorMap = {}; // socketId → color

function getColor(socketId) {
  if (!colorMap[socketId]) {
    colorMap[socketId] = COLORS[colorIndex % COLORS.length];
    colorIndex++;
  }
  return colorMap[socketId];
}

export const useSocketStore = create((set) => ({
  /** Map of socketId → { userId, fullName, color } */
  collaborators: {},

  addCollaborator: ({ socketId, userId, fullName }) =>
    set((state) => ({
      collaborators: {
        ...state.collaborators,
        [socketId]: { userId, fullName, color: getColor(socketId) },
      },
    })),

  removeCollaborator: (socketId) =>
    set((state) => {
      const next = { ...state.collaborators };
      delete next[socketId];
      return { collaborators: next };
    }),

  clearCollaborators: () => set({ collaborators: {} }),
}));
