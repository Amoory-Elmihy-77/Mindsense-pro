const express = require("express");
const gamificationController = require("../controllers/gamificationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// All gamification routes require a valid JWT
router.use(authMiddleware.protect);

router.get("/", gamificationController.getMyGamification);
router.post("/complete", gamificationController.completeGame);
router.delete("/reset", gamificationController.resetProgress);

module.exports = router;
