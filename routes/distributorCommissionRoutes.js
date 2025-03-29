const express = require("express");
const { settleDistributorCommission, getDistributorCommissionReport } = require("../controllers/distributorCommissionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/settle", authMiddleware, settleDistributorCommission);
router.get("/report", authMiddleware, getDistributorCommissionReport);

module.exports = router;
