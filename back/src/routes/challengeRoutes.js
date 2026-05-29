const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/", controller.challenges);
router.post("/", controller.createChallenge);
router.get("/me", controller.myChallenges);
router.post("/:id/join", controller.joinChallenge);
router.post("/:id/complete-task", controller.completeChallengeTask);
router.post("/:id/complete", controller.completeChallenge);

module.exports = router;
