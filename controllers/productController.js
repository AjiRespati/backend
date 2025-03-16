const db = require("../models");
const sequelize = db.sequelize;
const { Product, Metric, Price, Percentage } = require("../models");
const logger = require("../config/logger");
const path = require("path");

exports.createProduct = async (req, res) => {
    const { name, description, price, metricType, updateBy } = req.body;

    try {
        // ✅ Fetch Supplier Percentage from Percentages Table
        const supplierPercentage = await Percentage.findOne({ where: { key: "supplier" } });
        if (!supplierPercentage) {
            return res.status(500).json({ error: "Supplier percentage not set" });
        }

        // ✅ Calculate netPrice
        const netPrice = price * (100 / supplierPercentage.value);

        // ✅ Create Product
        const product = await Product.create({
            name,
            image: req.imagePath || null,
            description,
            updateBy
        });

        // ✅ Create Metric
        const metric = await Metric.create({
            productId: product.id,
            metricType,
            updateBy
        });

        // ✅ Create Price with netPrice
        await Price.create({
            metricId: metric.id,
            price,
            netPrice,
            updateBy
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("❌ Product Creation Error:", error);
        res.status(500).json({ error: "Failed to create product" });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id AS "productId",
                p.name AS "productName",
                p.image,
                p.description,
                m.id AS "metricId",
                m."metricType",
                (
                    SELECT s."updateAmount"
                    FROM "Stocks" s
                    WHERE s."metricId" = m.id
                    ORDER BY s."createdAt" DESC
                    LIMIT 1
                ) AS "totalStock",
                pr.price,
                pr."netPrice",
                (
                    SELECT s."createdAt"
                    FROM "Stocks" s
                    WHERE s."metricId" = m.id AND s."stockEvent" = 'stock_in'
                    ORDER BY s."createdAt" DESC
                    LIMIT 1
                ) AS "last_stock_in",
                (
                    SELECT s."createdAt"
                    FROM "Stocks" s
                    WHERE s."metricId" = m.id AND s."stockEvent" = 'stock_out'
                    ORDER BY s."createdAt" DESC
                    LIMIT 1
                ) AS "last_stock_out"
            FROM "Products" p
            LEFT JOIN "Metrics" m ON p.id = m."productId"
            LEFT JOIN (
                SELECT 
                    "metricId",
                    price,
                    "netPrice",
                    "createdAt"
                FROM "Prices"
                WHERE "createdAt" IN (
                    SELECT MAX("createdAt") 
                    FROM "Prices" 
                    GROUP BY "metricId"
                )
            ) pr ON pr."metricId" = m.id
            GROUP BY 
                p.id, m.id, pr.price, pr."netPrice"
            ORDER BY p."createdAt" DESC;
        `;

        const [results] = await sequelize.query(query);

        res.json(results);
    } catch (error) {
        console.error("❌ Raw SQL Error:", error);
        res.status(500).json({ error: "Failed to fetch product" });
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
