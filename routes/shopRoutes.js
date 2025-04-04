const express = require("express");
const { createShop, getAllShops, updateShop, getAllShopsBySales } = require("../controllers/shopController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createShop);
router.get("/", authMiddleware, getAllShops);
router.get("/:salesId", authMiddleware, getAllShopsBySales);
router.put("/:id", authMiddleware, updateShop);

module.exports = router;
