const { Agent } = require("../models");
const logger = require("../config/logger");

exports.createAgent = async (req, res) => {
    try {
        const { name, image, address, phone, email, updateBy } = req.body;
        const agent = await Agent.create({ name, image, address, phone, email, updateBy });

        logger.info(`Agent created: ${agent.name}`);
        res.status(201).json(agent);
    } catch (error) {
        logger.error(`Agent creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create agent" });
    }
};

exports.agentList = async (req, res) => {
    try {
        const agents = await Agent.findAll();
        res.json(agents);
    } catch (error) {
        logger.error(`Fetching agents error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve agents" });
    }
};

exports.updateAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, address, phone, email, updateBy } = req.body;

        const agent = await Agent.findByPk(id);
        if (!agent) return res.status(404).json({ error: "Agent not found" });

        Object.assign(agent, { name, image, address, phone, email, updateBy });
        await agent.save();

        logger.info(`Agent updated: ${agent.name}`);
        res.json(agent);
    } catch (error) {
        logger.error(`Updating agent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update agent" });
    }
};
