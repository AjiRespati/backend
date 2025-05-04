const express = require("express");
const {
    getCommissionSummary,
    getAgentDetail,
    getSubAgentDetail,
    getSalesmanDetail,
    getShopDetail,
    getComDetailByClient,
    getClientCommission,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/commissionSummary", authMiddleware, getCommissionSummary);
router.get("/agentDetail", authMiddleware, getAgentDetail);
router.get("/subAgentDetail", authMiddleware, getSubAgentDetail);
router.get("/salesmanDetail", authMiddleware, getSalesmanDetail);
router.get("/shopDetail", authMiddleware, getShopDetail);
router.get("/clientDetail", authMiddleware, getClientCommission);
// router.get("/clientDetail", authMiddleware, getComDetailByClient);

module.exports = router;
