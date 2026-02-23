import "dotenv/config"; // Must be first — loads .env into process.env
import express from "express";
import http from "http";
import cors from "cors";
import { setupSocket } from "./lib/socket.js";
import authRoute from "./routes/authRoute.js";
import entryRoute from "./routes/entryRoute.js";
import notebookRoute from "./routes/notebookRoute.js";
import communityRoute from "./routes/communityRoute.js";


const app = express();
const server = http.createServer(app);

//Cors
app.use(cors());

// Initialize WebSockets
setupSocket(server);


app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/entries", entryRoute);
app.use("/api/notebooks", notebookRoute);
app.use("/api/community", communityRoute);

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
