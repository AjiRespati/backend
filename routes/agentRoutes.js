const express = require("express");
const { createAgent, updateAgent, agentList } = require("../controllers/agentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createAgent);
router.get("/", authMiddleware, agentList);
router.put("/", authMiddleware, updateAgent);
module.exports = router;
