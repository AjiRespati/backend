const express = require("express");
const { createStock, stockListByProduct, stockListBySales,
    stockListBySubAgent, stockListByAgent, getStockTable,
    getStockHistory, settlingStock } = require("../controllers/stockController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createStock);
router.get("/product/:productId", authMiddleware, stockListByProduct);
router.get("/sales/:salesId", authMiddleware, stockListBySales);
router.get("/subagent/:subAgentId", authMiddleware, stockListBySubAgent);
router.get("/agent/:agentId", authMiddleware, stockListByAgent);
router.get("/history", getStockHistory);
router.get("/table", getStockTable);
router.put("/settled", settlingStock);

module.exports = router;
