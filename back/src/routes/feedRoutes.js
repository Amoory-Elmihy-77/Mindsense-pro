const express = require("express");
const controller = require("../controllers/communityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/", controller.feed);
router.post("/", controller.createPost);
router.patch("/:id", controller.updatePost);
router.delete("/:id", controller.deletePost);
router.post("/:id/react", controller.reactToPost);
router.post("/:id/save", controller.savePost);
router.post("/:id/share", controller.sharePost);
router.get("/:id/comments", controller.comments);
router.post("/:id/comments", controller.addComment);

module.exports = router;
