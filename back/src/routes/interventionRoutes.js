const express = require("express");
const router = express.Router();
const controller = require("../controllers/interventionController");

router.post("/", controller.getAdvice);

module.exports = router;
