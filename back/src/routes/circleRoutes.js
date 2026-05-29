const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/", controller.circles);
router.post("/", controller.createCircle);
router.post("/:id/join", controller.joinCircle);
router.post("/:id/leave", controller.leaveCircle);

module.exports = router;
