const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);
router.get("/queue", controller.moderationQueue);
router.post("/posts/:id/action", controller.moderatePost);
router.post("/reports/:id/review", controller.reviewReport);

module.exports = router;
