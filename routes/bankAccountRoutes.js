const express = require("express");
const { createBankAccount, bankAccountListByAgent, bankAccountListBySalesman,
    bankAccountListBySubAgent, updateBankAccount } = require("../controllers/bankAccountController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createBankAccount);
router.get("/salesman/:id", authMiddleware, bankAccountListBySalesman);
router.get("/subAgent/:id", authMiddleware, bankAccountListBySubAgent);
router.get("/agent/:id", authMiddleware, bankAccountListByAgent);
router.put("/:id", authMiddleware, updateBankAccount);

module.exports = router;
