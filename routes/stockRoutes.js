const express = require("express");
const { createStock, stockListByProduct, stockListBySales,
    stockListBySubAgent, stockListByAgent, getStockTable,
    getStockHistory, settlingStock, cancelingStock } = require("../controllers/stockController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createStock);
router.get("/product/:productId", authMiddleware, stockListByProduct);
router.get("/sales/:salesId", authMiddleware, stockListBySales);
router.get("/subagent/:subAgentId", authMiddleware, stockListBySubAgent);
router.get("/agent/:agentId", authMiddleware, stockListByAgent);
router.get("/history", authMiddleware, getStockHistory);
router.get("/table", authMiddleware, getStockTable);
router.put("/settled", authMiddleware, settlingStock);
router.put("/canceled", authMiddleware, cancelingStock);

module.exports = router;
