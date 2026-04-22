const express = require("express");
const router = express.Router();
const multer = require("multer");
const emotionController = require("../controllers/emotionController");
const authMiddleware = require("../middlewares/authMiddleware");

const upload = multer();

router.post(
  "/face",
  authMiddleware.protect,
  upload.single("file"),
  emotionController.detectFace,
);
router.post(
  "/voice",
  authMiddleware.protect,
  upload.single("file"),
  emotionController.detectVoice,
);
router.post(
  "/all",
  authMiddleware.protect,
  upload.fields([
    { name: "face", maxCount: 1 },
    { name: "voice", maxCount: 1 },
  ]),
  emotionController.detectAll,
);
router.get("/history", authMiddleware.protect, emotionController.getHistory);
router.get("/report", authMiddleware.protect, emotionController.getReport);

module.exports = router;
