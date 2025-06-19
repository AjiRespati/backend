const express = require("express");
const { createShop, getAllShops, updateShop, getAllShopsBySales } = require("../controllers/shopController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, imageCompressor } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createShop);
router.get("/", authMiddleware, getAllShops);
router.get("/:id", authMiddleware, getAllShopsBySales);
router.put("/:id", authMiddleware, upload.single("image"),  imageCompressor,  updateShop);

module.exports = router;
