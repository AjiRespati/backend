const express = require("express");
const { createSalesman, salesmanList, updateSalesman } = require("../controllers/salesmanController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createSalesman);
router.get("/", authMiddleware, salesmanList);
router.put("/:id", authMiddleware, updateSalesman);
module.exports = router;
