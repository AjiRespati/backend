const express = require("express");
const { settleShopCommission, getShopCommissionReport } = require("../controllers/shopCommissionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/settle", authMiddleware, settleShopCommission);
router.get("/report", authMiddleware, getShopCommissionReport);

module.exports = router;
