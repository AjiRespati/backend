const express = require("express");
const { settleAgentCommission, getAgentCommissionReport } = require("../controllers/agentCommissionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/settle", authMiddleware, settleAgentCommission);
router.get("/report", authMiddleware, getAgentCommissionReport);

module.exports = router;
