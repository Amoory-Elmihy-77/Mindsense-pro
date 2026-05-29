require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const app = require("./src/app");
const communityHub = require("./src/realtime/communityHub");

const PORT = process.env.PORT || 5020;
const MONGO_URI = process.env.MONGO_URI;
const server = http.createServer(app);

communityHub.attach(server);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
