const express = require("express");
const { settleSalesmanCommission, getSalesmanCommissionReport } = require("../controllers/salesmanCommissionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/settle", authMiddleware, settleSalesmanCommission);
router.get("/report", authMiddleware, getSalesmanCommissionReport);

module.exports = router;
