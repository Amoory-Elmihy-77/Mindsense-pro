const express = require("express");
const router = express.Router();
const professionalController = require("../controllers/professionalController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", professionalController.getAllProfessionals);

// Requires auth
router.use(authMiddleware.protect);

router.get(
  "/my-stats",
  authMiddleware.restrictTo("professional"),
  professionalController.getMyStats,
);

router.get("/:id", professionalController.getProfessional);

// Any user can apply to become a professional
router.post(
  "/apply",
  authMiddleware.restrictTo("user"),
  professionalController.apply,
);

// Any user can follow a professional
router.post(
  "/:id/follow",
  authMiddleware.restrictTo("user"),
  professionalController.follow,
);

module.exports = router;
