const { Metric } = require("../models");
const logger = require("../config/logger");

exports.createMetric = async (req, res) => {
    try {
        const { productId, metricType, updateBy } = req.body;
        console.log(req.body);
        const metric = await Metric.create({ productId, metricType, updateBy });

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
