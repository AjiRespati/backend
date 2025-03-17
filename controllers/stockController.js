const { Stock, Metric, Price, Percentage } = require("../models");
const logger = require("../config/logger");

exports.createStock = async (req, res) => {
    try {
        const { metricId, stockEvent, amount, createdBy, salesId, subAgentId, agentId, status, description } = req.body;

        let initialAmount = 0;
        const lastStock = await Stock.findOne({ where: { metricId }, order: [["createdAt", "DESC"]] });
        if (lastStock) {
            initialAmount = lastStock.updateAmount ? lastStock.updateAmount : 0;
        }

        const updateAmount = stockEvent === 'stock_in' ? initialAmount + amount : initialAmount - amount;
        if (updateAmount < 0) return res.status(400).json({ message: 'Not enough stock' });

        // ✅ Fetch the latest price for this metric
        const latestPrice = await Price.findOne({ where: { metricId }, order: [["createdAt", "DESC"]] });
        if (!latestPrice) return res.status(400).json({ error: "No price available for this metric" });

        // ✅ Fetch percentage values
        const percentages = await Percentage.findAll();
        const percentageMap = {};
        percentages.forEach(p => { percentageMap[p.key] = p.value; });

        // ✅ Calculate stock values
        const totalPrice = amount * latestPrice.price;
        const totalNetPrice = totalPrice * (100 / percentageMap["supplier"]);

        let totalDistributorShare;
        let totalSalesShare = null;
        let totalSubAgentShare = null;
        let totalAgentShare = null;

        if (salesId) {
            totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["salesman"]) / 100;
            totalSalesShare = totalNetPrice * (percentageMap["salesman"] / 100);
        } else if (subAgentId) {
            totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["subAgent"]) / 100;
            totalSubAgentShare = totalNetPrice * (percentageMap["subAgent"] / 100);
        } else if (agentId) {
            totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["agent"]) / 100;
            totalAgentShare = totalNetPrice * (percentageMap["agent"] / 100);
        } else {
            totalDistributorShare = 0;
        }

        const totalShopShare =stockEvent === 'stock_in' ? null : totalNetPrice * (percentageMap["shop"] / 100);

        // ✅ Create Stock Entry
        const stock = await Stock.create({
            metricId, stockEvent, initialAmount, amount, updateAmount, totalPrice, totalNetPrice,
            totalDistributorShare, totalSalesShare, totalSubAgentShare, totalAgentShare, totalShopShare,
            createdBy: req.user.username, salesId, subAgentId, agentId, status, description
        });

        logger.info(`Stock ${stockEvent} created for metric ${metricId}`);
        res.status(201).json(stock);
    } catch (error) {
        logger.error(`Stock creation error: ${error.stack}`);
        res.status(500).json({ error: "Stock creation failed" });
    }
};

exports.stockListByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // ✅ Get all metric IDs for this product
        const metrics = await Metric.findAll({ where: { productId } });
        const metricIds = metrics.map(m => m.id);
        console.log(metricIds);

        const stocks = await Stock.findAll({ where: { metricId: metricIds } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by product error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};

exports.stockListBySales = async (req, res) => {
    try {
        const { salesId } = req.params;
        const stocks = await Stock.findAll({ where: { salesId } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by salesman error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};

exports.stockListBySubAgent = async (req, res) => {
    try {
        const { subAgentId } = req.params;
        const stocks = await Stock.findAll({ where: { subAgentId } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by sub-agent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};

exports.stockListByAgent = async (req, res) => {
    try {
        const { agentId } = req.params;
        const stocks = await Stock.findAll({ where: { agentId } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by agent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};
