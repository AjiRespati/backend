const { Product } = require("../models");
const logger = require("../config/logger");
const path = require("path");

exports.createProduct = async (req, res) => {
    try {
        const { name, description, updateBy } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        console.log("📢 Received Data:", { name, image:imagePath, description, updateBy }); // Debug input data

        const product = await Product.create({ name, image: imagePath, description, updateBy });

        logger.info(`Product created: ${product.name}`);
        res.status(201).json(product);
    } catch (error) {
        // console.error("❌ Product creation error:", error); // Full error log
        logger.error(`Product creation error: ${error.stack}`);
        res.status(500).json({ error: "Product creation failed" });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        logger.error(`Fetch products error: ${error.stack}`);
        res.status(500).json({ error: "Fetching products failed" });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        res.json(product);
    } catch (error) {
        logger.error(`Fetch product error: ${error.stack}`);
        res.status(500).json({ error: "Fetching product failed" });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, updateBy } = req.body;
        const product = await Product.findByPk(req.params.id);

        if (!product) return res.status(404).json({ error: "Product not found" });

        const imagePath = req.file ? `/uploads/${req.file.filename}` : product.image;

        product.name = name || product.name;
        product.image = imagePath;
        product.description = description || product.description;
        product.updateBy = updateBy || product.updateBy;

        await product.save();
        logger.info(`Product updated: ${product.name}`);

        res.json(product);
    } catch (error) {
        logger.error(`Update product error: ${error.stack}`);
        res.status(500).json({ error: "Updating product failed" });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        await product.destroy();
        logger.info(`Product deleted: ${product.name}`);

        res.json({ message: "Product deleted" });
    } catch (error) {
        logger.error(`Delete product error: ${error.stack}`);
        res.status(500).json({ error: "Deleting product failed" });
    }
};
