import "dotenv/config"; // Must be first — loads .env into process.env
import express from "express";
import authRoute from "./routes/authRoute.js";
import entryRoute from "./routes/entryRoute.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/entries", entryRoute);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
