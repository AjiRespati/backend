const express = require("express");
const {
    getCommissionSummary,
    getAgentDetail,
    getSubAgentDetail,
    getSalesmanDetail,
    getShopDetail
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/commissionSummary", authMiddleware, getCommissionSummary);
router.get("/agentDetail", authMiddleware, getAgentDetail);
router.get("/subAgentDetail", authMiddleware, getSubAgentDetail);
router.get("/salesmanDetail", authMiddleware, getSalesmanDetail);
router.get("/shopDetail", authMiddleware, getShopDetail);

module.exports = router;
