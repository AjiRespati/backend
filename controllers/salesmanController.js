const { Salesman, SubAgent } = require("../models");
const logger = require("../config/logger");

exports.createSalesman = async (req, res) => {
    try {
        const { name, image, address, phone, email, updateBy } = req.body;
        const salesman = await Salesman.create({ name, image, address, phone, email, updateBy });

        logger.info(`Salesman created: ${salesman.name}`);
        res.status(201).json(salesman);
    } catch (error) {
        logger.error(`Salesman creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create salesman" });
    }
};

exports.salesmanList = async (req, res) => {
    try {
        const { subAgentId } = req.params;
        const salesmen = await Salesman.findAll();
        res.json(salesmen);
    } catch (error) {
        logger.error(`Fetching salesmen by sub-agent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve salesmen" });
    }
};

exports.updateSalesman = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, address, phone, email, updateBy } = req.body;

        const salesman = await Salesman.findByPk(id);
        if (!salesman) return res.status(404).json({ error: "Salesman not found" });

        Object.assign(salesman, { name, image, address, phone, email, updateBy });
        await salesman.save();

        logger.info(`Salesman updated: ${salesman.name}`);
        res.json(salesman);
    } catch (error) {
        logger.error(`Updating salesman error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update salesman" });
    }
};
