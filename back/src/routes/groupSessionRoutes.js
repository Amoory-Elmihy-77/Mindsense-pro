const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/", controller.groupSessions);
router.post("/", controller.createGroupSession);
router.post("/:id/join", controller.joinGroupSession);
router.post("/:id/leave", controller.leaveGroupSession);

module.exports = router;
