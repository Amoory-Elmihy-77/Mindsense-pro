const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/", controller.buddies);
router.post("/invite", controller.inviteBuddy);
router.post("/:id/accept", controller.acceptBuddy);
router.post("/:id/encourage", controller.encourageBuddy);

module.exports = router;
