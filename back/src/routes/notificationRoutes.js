const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);
router.get("/", controller.notifications);
router.patch("/:id/read", controller.readNotification);

module.exports = router;
