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
        console.log(metric.id, price, netPrice);

        // ✅ Fetch percentage values
        const percentages = await Percentage.findAll();
        const percentageMap = {};
        percentages.forEach(p => { percentageMap[p.key] = p.value; });

        // ✅ Calculate stock values
        const salesmanPrice = netPrice * ((100 - percentageMap["shop"]) / 100);
        const subAgentPrice = netPrice * ((100 - percentageMap["shop"]) / 100); // bisa diganti
        const agentPrice = netPrice * ((100 - percentageMap["shop"] - percentageMap["agent"]) / 100);

        await Price.create({
            metricId: metric.id, price, netPrice, salesmanPrice,
            subAgentPrice, agentPrice, updateBy: req.user.username
        });

        logger.info(`Metric created for product: ${productId}`);
        res.status(200).json(metric);
    } catch (error) {
        logger.error(`Metric creation error: ${error.stack}`);
        logger.error(error);

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
