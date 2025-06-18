const express = require("express");
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, imageCompressor } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", authMiddleware, upload.single("image"), imageCompressor, createProduct);
router.get("/", authMiddleware, getAllProducts);
router.get("/:productId", authMiddleware, getProductById);
router.put("/:id", authMiddleware, upload.single("image"), imageCompressor, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;
