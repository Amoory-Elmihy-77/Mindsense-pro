const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");

const userRouter = require("./routes/userRoutes");
const emotionRoutes = require("./routes/emotionRoutes");
const interventionRoutes = require("./routes/interventionRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const professionalRoutes = require("./routes/professionalRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));

// Static – serve uploaded profile images
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/emotion", emotionRoutes);
app.use("/api/intervention", interventionRoutes);
app.use("/api/v1/voice", voiceRoutes);
app.use("/api/v1/professionals", professionalRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/gamification", gamificationRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("MindSense AI Backend is Running... 🧠");
});

module.exports = app;
