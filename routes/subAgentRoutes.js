const express = require("express");
const { createSubAgent, subagentLists, updateSubagent } = require("../controllers/subagentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createSubAgent);
router.get("/", authMiddleware, subagentLists);
router.put("/:id", authMiddleware, updateSubagent);
module.exports = router;
