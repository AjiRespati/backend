const { Metric, Price, Percentage } = require("../models");
const logger = require("../config/logger");

exports.createMetric = async (req, res) => {
    try {
        const { productId, metricType, price, updateBy } = req.body;

        // ✅ Fetch Supplier Percentage from Percentages Table
        const supplierPercentage = await Percentage.findOne({ where: { key: "supplier" } });
        if (!supplierPercentage) {
            return res.status(500).json({ error: "Supplier percentage not set" });
        }

        // ✅ Calculate netPrice
        const netPrice = price * (100 / supplierPercentage.value);

        const metric = await Metric.create({ productId, metricType, updateBy: req.user.username });

        // ✅ Create Price with netPrice
        await Price.create({
            metricId: metric.id,
            price,
            netPrice,
            updateBy: req.user.username
        });

        logger.info(`Metric created for product: ${productId}`);
        res.status(201).json(metric);
    } catch (error) {
        logger.error(`Metric creation error: ${error.stack}`);
        res.status(500).json({ error: "Metric creation failed" });
    }
};

exports.metricListByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const metrics = await Metric.findAll({ where: { productId } });

        res.json(metrics);
    } catch (error) {
        logger.error(`Fetch metrics error: ${error.stack}`);
        res.status(500).json({ error: "Fetching metrics failed" });
    }
};
