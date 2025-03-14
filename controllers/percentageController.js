const { Percentage } = require("../models");
const logger = require("../config/logger");

// ✅ Create or Update Initial Percentages
exports.createPercentage = async (req, res) => {
    try {
        const { key, value, updateBy } = req.body;

        const allowedKeys = ["supplier", "distributor", "shop", "salesman", "subAgent", "agent"];
        if (!allowedKeys.includes(key)) {
            return res.status(400).json({ error: "Invalid key value" });
        }

        let percentage = await Percentage.findOne({ where: { key } });

        if (percentage) {
            return res.status(400).json({ error: "Percentage key already exists. Use update instead." });
        }

        percentage = await Percentage.create({ key, value, updateBy });

        logger.info(`Percentage created: ${key} = ${value}`);
        res.status(201).json(percentage);
    } catch (error) {
        logger.error(`Percentage creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create percentage" });
    }
};

// ✅ Get All Percentages
exports.percentageList = async (req, res) => {
    try {
        const percentages = await Percentage.findAll();
        res.json(percentages);
    } catch (error) {
        logger.error(`Fetching percentages error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve percentages" });
    }
};

// ✅ Update Percentage (Predefined Keys Only)
exports.updatePercentage = async (req, res) => {
    try {
        const { id } = req.params;
        const { value, updateBy } = req.body;

        const percentage = await Percentage.findOne({ where: { id } });
        if (!percentage) return res.status(404).json({ error: "Percentage key not found" });

        percentage.value = value;
        percentage.updateBy = updateBy;
        await percentage.save();

        logger.info(`Percentage updated: ${percentage.key} = ${value}`);
        res.json(percentage);
    } catch (error) { 
        logger.error(`Updating percentage error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update percentage" });
    }
};
