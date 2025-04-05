const { Shop, Refrigerator } = require("../models");
const logger = require("../config/logger");

exports.createShop = async (req, res) => {
    try {
        const { name, image, address, coordinates, phone, email, salesId } = req.body;
        logger.info(`Shop : ${JSON.stringify(req.body)}`);
        const shop = await Shop.create({ name, image, address, coordinates, phone, email, salesId, updateBy: req.user.username });

        logger.info(`Shop created: ${shop.name}`);
        res.status(200).json(shop);
    } catch (error) {
        console.error('Unique Constraint Error:', error.errors[0].message);
        logger.error(`Shop creation error: ${error}`);
        res.status(500).json({ error: error.errors[0].message });
    }
};

exports.getAllShops = async (req, res) => {
    try {
        const shops = await Shop.findAll();
        res.json(shops);
    } catch (error) {
        logger.error(`Fetching shops error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve shops" });
    }
};


exports.getAllShopsBySales = async (req, res) => {
    try {
        const { salesId } = req.params;
        let shops = [];
        const salesmanShops = await Shop.findAll({
            where: { salesId },
            include: [{
                model: Refrigerator,
                //   as: 'Refrigerators', // Optional: Provide an alias for the association
            }],
        });
        const subAgentShops = await Shop.findAll({
            where: { subAgentId: salesId },
            include: [{
                model: Refrigerator,
                //   as: 'Refrigerators', // Optional: Provide an alias for the association
            }],
        });
        const agentShops = await Shop.findAll({
            where: { agentId: salesId },
            include: [{
                model: Refrigerator,
                //   as: 'Refrigerators', // Optional: Provide an alias for the association
            }],
        });

        if (salesmanShops.length > 0) {
            shops = salesmanShops;
        } else if (subAgentShops.length > 0) {
            shops = subAgentShops;
        } else {
            shops = agentShops;            
        }

        res.json(shops);
    } catch (error) {
        logger.error(`Fetching shops error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve shops" });
    }
};

exports.updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, address, coordinates, phone, email, updateBy } = req.body;

        const shop = await Shop.findByPk(id);
        if (!shop) return res.status(404).json({ error: "Shop not found" });

        Object.assign(shop, { name, image, address, coordinates, phone, email, updateBy: req.user.username });
        await shop.save();

        logger.info(`Shop updated: ${shop.name}`);
        res.json(shop);
    } catch (error) {
        logger.error(`Updating shop error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update shop" });
    }
};
