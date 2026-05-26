const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const userRouter = require("./routes/userRoutes");
const emotionRoutes = require("./routes/emotionRoutes");
const interventionRoutes = require("./routes/interventionRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const professionalRoutes = require("./routes/professionalRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/emotion", emotionRoutes);
app.use("/api/intervention", interventionRoutes);
app.use("/api/v1/voice", voiceRoutes);
app.use("/api/v1/professionals", professionalRoutes);
app.use("/api/v1/sessions", sessionRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("MindSense AI Backend is Running... 🧠");
});

module.exports = app;
