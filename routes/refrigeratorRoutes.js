const express = require("express");
const { createRefrigerator, getAllRefrigerators, updateRefrigerator, returnRefrigerator } = require("../controllers/refrigeratorController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, imageCompressor } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createRefrigerator);
router.get("/", authMiddleware, getAllRefrigerators);
router.put("/:id", authMiddleware, upload.single("image"), imageCompressor, updateRefrigerator);
router.put("/return/:id", authMiddleware, returnRefrigerator);

module.exports = router;
