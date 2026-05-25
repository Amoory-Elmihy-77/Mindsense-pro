const express = require("express");
const router = express.Router();
const multer = require("multer");
const voiceController = require("../controllers/voiceController");
const voiceSettingsController = require("../controllers/voiceSettingsController");
const authMiddleware = require("../middlewares/authMiddleware");
const subscriptionMiddleware = require("../middlewares/subscriptionMiddleware");

const upload = multer();

router.use(authMiddleware.protect);

router.get("/settings", voiceSettingsController.getSettings);
router.patch("/settings", voiceSettingsController.updateSettings);
router.post("/settings/preview", voiceSettingsController.previewVoice);

router.post("/session/start", subscriptionMiddleware.checkQuota({ requireSessionSlot: true }), voiceController.startSession);
router.post("/session/message", subscriptionMiddleware.checkQuota({ requireSessionSlot: false }), upload.single("audio"), voiceController.processMessage);
router.post("/session/end", voiceController.endSession);

router.get("/history", voiceController.getHistory);
router.get("/subscription/check", voiceController.checkSubscription);
router.post("/subscription/reset", voiceController.resetUsage);

module.exports = router;
