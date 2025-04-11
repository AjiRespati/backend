const { Refrigerator, Shop } = require("../models");
const logger = require("../config/logger");

exports.createRefrigerator = async (req, res) => {
    try {
        const { name, capacity, serialNumber, coordinates, shopId, status, deliveryDate, deliveryBy } = req.body;
        const refrigerator = await Refrigerator.create({ name, capacity, serialNumber, coordinates, shopId, status, deliveryDate, deliveryBy });

        logger.info(`Refrigerator created: ${refrigerator.name} (Serial: ${serialNumber})`);
        res.status(200).json(refrigerator);
    } catch (error) {
        logger.error(`Refrigerator creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create refrigerator" });
    }
};

exports.getAllRefrigerators = async (req, res) => {
    try {
        const refrigerators = await Refrigerator.findAll({
            include: {
                model: Shop
            }
        });
        res.json(refrigerators);
    } catch (error) {
        logger.error(`Fetching refrigerators error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve refrigerators" });
    }
};

exports.updateRefrigerator = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, capacity, serialNumber, coordinates, shopId, status, retrieveDate, retrieveBy,
            repairedDate, repairedBy, description } = req.body;

        const refrigerator = await Refrigerator.findByPk(id);
        if (!refrigerator) return res.status(404).json({ error: "Refrigerator not found" });

        refrigerator.name = name || refrigerator.name;
        refrigerator.capacity = capacity || refrigerator.capacity;
        refrigerator.serialNumber = serialNumber || refrigerator.serialNumber;
        refrigerator.coordinates = coordinates || refrigerator.coordinates;
        refrigerator.shopId = shopId || refrigerator.shopId;
        refrigerator.status = status || refrigerator.status;
        refrigerator.retrieveDate = retrieveDate || refrigerator.retrieveDate;
        refrigerator.retrieveBy = retrieveBy || refrigerator.retrieveBy;
        refrigerator.repairedDate = repairedDate || refrigerator.repairedDate;
        refrigerator.repairedBy = repairedBy || refrigerator.repairedBy;
        refrigerator.description = description || refrigerator.description;

        await refrigerator.save();

        logger.info(`Refrigerator updated: ${refrigerator.name} (Serial: ${serialNumber})`);
        res.json(refrigerator);
    } catch (error) {
        logger.error(`Updating refrigerator error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update refrigerator" });
    }
};


exports.returnRefrigerator = async (req, res) => {
    try {
        const { id } = req.params;
        const refrigerator = await Refrigerator.findByPk(id);
        if (!refrigerator) return res.status(404).json({ error: "Refrigerator not found" });

        refrigerator.shopId = null;

        await refrigerator.save();

        logger.info(`Refrigerator return : ${refrigerator.name} (Serial: ${refrigerator.serialNumber})`);
        res.json(refrigerator);
    } catch (error) {
        logger.error(`Updating refrigerator error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update refrigerator" });
    }
};
