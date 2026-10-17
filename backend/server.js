import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"

import event from "./routes/event.routes.js"
import feedback from "./routes/feedback.routes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/events", event);
app.use("/api/feedback", feedback);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ADG backend is running!",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const startServer = async() => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");
    app.listen(PORT, () => {
      console.log(`server running!`);
    });
  } catch (err) {
    console.log("Failed! ", err.message);
    process.exit(1);
  }
};

startServer();

