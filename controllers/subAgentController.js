const { SubAgent } = require("../models");
const logger = require("../config/logger");

exports.createSubAgent = async (req, res) => {
    try {
        const { name, image, address, phone, email, updateBy } = req.body;
        const subAgent = await SubAgent.create({ name, image, address, phone, email, updateBy: req.user.username });

        logger.info(`SubAgent created: ${subAgent.name}`);
        res.status(201).json(subAgent);
    } catch (error) {
        logger.error(`SubAgent creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create sub-agent" });
    }
};

exports.subagentLists = async (req, res) => {
    try {
        const subagents = await SubAgent.findAll();
        res.json(subagents);
    } catch (error) {
        logger.error(`Fetching subagents error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve subagents" });
    }
};

exports.updateSubagent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, address, phone, email, updateBy } = req.body;

        const subAgent = await SubAgent.findByPk(id);
        if (!subAgent) return res.status(404).json({ error: "SubAgent not found" });

        Object.assign(subAgent, { name, image, address, phone, email, updateBy: req.user.username });
        await subAgent.save();

        logger.info(`SubAgent updated: ${subAgent.name}`);
        res.json(subAgent);
    } catch (error) {
        logger.error(`Updating subagent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update subagent" });
    }
};
