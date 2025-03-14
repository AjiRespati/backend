const express = require("express");
const { createMetric, metricListByProduct } = require("../controllers/metricController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createMetric);
router.get("/:productId", authMiddleware, metricListByProduct);

module.exports = router;
