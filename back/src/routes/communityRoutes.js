const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/overview", controller.overview);
router.get("/health", controller.communityHealth);
router.post("/checkins", controller.checkIn);
router.get("/checkins/me", controller.myCheckIns);
router.post("/reports", controller.report);

module.exports = router;
