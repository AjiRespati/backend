const db = require("../models");
const sequelize = db.sequelize;
const { Product, Metric, Price, Percentage } = require("../models");
const logger = require("../config/logger");
const path = require("path");

exports.createProduct = async (req, res) => {
    const { name, description, price, shopPrice, netPrice, metricType } = req.body;
    let doublePrice
    let doubleShopPrice
    let doubleNetPrice

    try {
        doublePrice = stringToDouble(price);
        doubleShopPrice = stringToDouble(shopPrice);
        doubleNetPrice = stringToDouble(netPrice);
    } catch (error) {
        console.error("❌ APA INI:", (error));
        return res.status(400).json({ error: "Ada komponen harga bukan angka." });
    }

    // ✅ Fetch percentage values
    const percentages = await Percentage.findAll();
    const percentageMap = {};
    percentages.forEach(p => { percentageMap[p.key] = p.value; });

    // ✅ Check all prices values
    if (doubleShopPrice - doublePrice != ((doubleNetPrice * percentageMap['distributor']) / 100)) {
        return res.status(400).json({ error: "Ada komponen harga yang tidak sesuai." });
    }

    // ✅ Calculate stock values
    // const netPrice = price * (100 / percentageMap["supplier"]);
    // const salesmanPrice = netPrice * ((100 - percentageMap["shop"]) / 100);
    // const subAgentPrice = netPrice * ((100 - percentageMap["shop"]) / 100); // bisa diganti
    // const agentPrice = netPrice * ((100 - percentageMap["shop"] - percentageMap["agent"]) / 100);

    // ✅ Calculate agentPrice values
    const agentPaidPercentage = (percentageMap['distributor'] - percentageMap['agent']);
    const agentPrice = (doublePrice + (doubleNetPrice * (agentPaidPercentage / 100)));

    try {
        // // ✅ Fetch Supplier Percentage from Percentages Table
        // const supplierPercentage = await Percentage.findOne({ where: { key: "supplier" } });
        // if (!supplierPercentage) {
        //     return res.status(500).json({ error: "Supplier percentage not set" });
        // }

        // // ✅ Calculate netPrice
        // const netPrice = price * (100 / supplierPercentage.value);

        // ✅ Create Product
        const product = await Product.create({
            name,
            image: req.imagePath || null,
            description,
            updateBy: req.user.username
        });

        // ✅ Create Metric
        const metric = await Metric.create({
            productId: product.id,
            metricType,
            updateBy: req.user.username
        });

        // ✅ Create Price with netPrice
        await Price.create({
            metricId: metric.id,
            price: doublePrice,
            netPrice: doubleNetPrice,
            salesmanPrice: doubleShopPrice,
            subAgentPrice: doubleShopPrice,
            agentPrice,
            shopPrice: doubleShopPrice,
            updateBy: req.user.username
        });

        res.status(200).json(product);
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
                    WHERE s."metricId" = m.id AND s."status" = 'settled'
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
                    WHERE s."metricId" = m.id AND s."stockEvent" = 'stock_out' AND s."status" = 'settled'
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
            WHERE p."status" = 'active'
            GROUP BY 
                p.id, m.id, pr.price, pr."netPrice"
            ORDER BY p."createdAt" DESC;
        `;

        const [results] = await sequelize.query(query);

        let realResult = [];
        let productMap = new Map();

        results.forEach((item) => {
            if (productMap.has(item.productId)) {
                let existingItem = productMap.get(item.productId);
                existingItem.totalStock += item.totalStock;
            } else {
                productMap.set(item.productId, { ...item });
            }
        });

        productMap.forEach((item) => {
            realResult.push({
                productId: item.productId,
                productName: item.productName,
                image: item.image,
                description: item.description,
                totalStock: item.totalStock,
                last_stock_in: item.last_stock_in,
                last_stock_out: item.last_stock_out,
            });
        });

        res.json(realResult);
    } catch (error) {
        console.error("❌ Raw SQL Error:", error);
        res.status(500).json({ error: "Failed to fetch product" });
    }
};

exports.getProductById = async (req, res) => {
    const { productId } = req.params;
    try {
        const query = `
            SELECT 
                p.id AS "productId",
                p.name AS "productName",
                p.image,
                p.description,
                p.status,
                m.id AS "metricId",
                m."metricType",
                (
                    SELECT s."updateAmount"
                    FROM "Stocks" s
                    WHERE s."metricId" = m.id AND s."status" = 'settled'
                    ORDER BY s."createdAt" DESC
                    LIMIT 1
                ) AS "totalStock",
                pr.id AS "priceId",
                pr.price,
                pr."netPrice",
                pr."salesmanPrice",
                pr."subAgentPrice",
                pr."agentPrice",
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
                    WHERE s."metricId" = m.id AND s."stockEvent" = 'stock_out' AND s."status" = 'settled'
                    ORDER BY s."createdAt" DESC
                    LIMIT 1
                ) AS "last_stock_out"
            FROM "Products" p
            LEFT JOIN "Metrics" m ON p.id = m."productId"
            LEFT JOIN (
                SELECT 
                    id,
                    "metricId",
                    price,
                    "netPrice",
                    "salesmanPrice",
                    "subAgentPrice",
                    "agentPrice",
                    "createdAt"
                FROM "Prices"
                WHERE "createdAt" IN (
                    SELECT MAX("createdAt") 
                    FROM "Prices" 
                    GROUP BY "metricId"
                )
            ) pr ON pr."metricId" = m.id
            WHERE p.id = :productId
            GROUP BY 
                p.id, m.id, pr.id, pr.price, pr."netPrice", pr."salesmanPrice", pr."subAgentPrice", pr."agentPrice"
            ORDER BY p."createdAt" DESC;
        `;

        const [results] = await sequelize.query(query, {
            replacements: { productId }
        });

        res.json(results);
    } catch (error) {
        console.error("❌ Raw SQL Error:", error);
        res.status(500).json({ error: "Failed to fetch product" });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        const product = await Product.findByPk(req.params.id);

        if (!product) return res.status(404).json({ error: "Product not found" });

        // const imagePath = req.file ? `/uploads/${req.file.filename}` : product.image;

        product.name = name || product.name;
        // product.image = imagePath;
        product.description = description || product.description;
        product.status = status || product.status;
        product.updateBy = req.user.username;

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

function stringToDouble(str) {
    // Replace comma with period if needed
    let normalizedStr = str.replace(',', '.');

    // Convert to number
    let num = parseFloat(normalizedStr);

    // Check if conversion was successful
    if (isNaN(num)) {
        throw new Error(`Cannot convert "${str}" to number`);
    }

    return num;
}