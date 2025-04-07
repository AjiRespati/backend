const { Price, Percentage } = require("../models");
const logger = require("../config/logger");

exports.createPrice = async (req, res) => {
    try {
        const { metricId, price } = req.body;

        // ✅ Fetch percentage values
        const percentages = await Percentage.findAll();
        const percentageMap = {};
        percentages.forEach(p => { percentageMap[p.key] = p.value; });

        // ✅ Calculate stock values
        const netPrice = price * (100 / percentageMap["supplier"]);
        const salesmanPrice = netPrice * ((100 - percentageMap["shop"]) / 100);
        const subAgentPrice = netPrice * ((100 - percentageMap["shop"]) / 100); // bisa diganti
        const agentPrice = netPrice * ((100 - percentageMap["shop"] - percentageMap["agent"]) / 100);

        const newPrice = await Price.create({
            metricId, price, netPrice, salesmanPrice,
            subAgentPrice, agentPrice, updateBy: req.user.username
        });

        logger.info(`Price added for metric: ${metricId}`);
        res.status(200).json(newPrice);
    } catch (error) {
        logger.error(`Price creation error: ${error.stack}`);
        res.status(500).json({ error: "Price creation failed" });
    }
};

exports.getPricesByMetric = async (req, res) => {
    try {
        const { metricId } = req.params;
        const prices = await Price.findAll({ where: { metricId } });

        res.json(prices);
    } catch (error) {
        logger.error(`Fetch prices error: ${error.stack}`);
        res.status(500).json({ error: "Fetching prices failed" });
    }
};

exports.updatePrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, netPrice, updateBy } = req.body;

        const existingPrice = await Price.findByPk(id);
        if (!existingPrice) return res.status(404).json({ error: "Price not found" });

        existingPrice.price = price || existingPrice.price;
        existingPrice.netPrice = netPrice || existingPrice.netPrice;
        existingPrice.updateBy = req.user.username;

        await existingPrice.save();
        logger.info(`Price updated: ${id}`);

        res.json(existingPrice);
    } catch (error) {
        logger.error(`Update price error: ${error.stack}`);
        res.status(500).json({ error: "Updating price failed" });
    }
};
