const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/", controller.rooms);
router.post("/", controller.createRoom);
router.post("/:id/join", controller.joinRoom);
router.post("/:id/leave", controller.leaveRoom);
router.get("/:id/messages", controller.roomMessages);
router.post("/:id/messages", controller.addRoomMessage);

module.exports = router;
