const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const authMiddleware = require("../middlewares/authMiddleware");
const paymentProofUpload = require("../middlewares/paymentProofUploadMiddleware");

router.use(authMiddleware.protect);

router.post(
  "/book",
  authMiddleware.restrictTo("user"),
  paymentProofUpload.single("paymentProof"),
  sessionController.bookSession,
);
router.post(
  "/pay",
  authMiddleware.restrictTo("user"),
  sessionController.paySession,
);
router.post(
  "/:id/rate",
  authMiddleware.restrictTo("user"),
  sessionController.rateSession,
);
router.post(
  "/:id/accept",
  authMiddleware.restrictTo("professional"),
  sessionController.acceptSession,
);
router.post(
  "/:id/reject",
  authMiddleware.restrictTo("professional"),
  sessionController.rejectSession,
);
router.post(
  "/:id/complete",
  authMiddleware.restrictTo("professional"),
  sessionController.completeSession,
);
router.post(
  "/:id/seen",
  authMiddleware.restrictTo("professional"),
  sessionController.markAsSeen,
);
router.delete(
  "/:id",
  authMiddleware.restrictTo("professional"),
  sessionController.deleteSession,
);
router.get(
  "/professional-sessions",
  authMiddleware.restrictTo("professional"),
  sessionController.getProfessionalSessions,
);
router.get(
  "/my-sessions",
  authMiddleware.restrictTo("user"),
  sessionController.getUserSessions,
);

module.exports = router;
