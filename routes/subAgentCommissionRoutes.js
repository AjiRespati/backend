const express = require("express");
const { settleSubAgentCommission, getSubAgentCommissionReport } = require("../controllers/subAgentCommissionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/settle", authMiddleware, settleSubAgentCommission);
router.get("/report", authMiddleware, getSubAgentCommissionReport);

module.exports = router;
