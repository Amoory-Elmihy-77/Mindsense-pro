const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);
router.get("/", controller.leaderboard);

module.exports = router;
