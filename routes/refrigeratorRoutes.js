const express = require("express");
const { createRefrigerator, getAllRefrigerators, updateRefrigerator, returnRefrigerator } = require("../controllers/refrigeratorController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createRefrigerator);
router.get("/", authMiddleware, getAllRefrigerators);
router.put("/:id", authMiddleware, updateRefrigerator);
router.put("/return/:id", authMiddleware, returnRefrigerator);

module.exports = router;
