const { Shop } = require("../models");
const logger = require("../config/logger");

exports.createShop = async (req, res) => {
    try {
        const { name, image, address, coordinates, phone, email, updateBy } = req.body;
        const shop = await Shop.create({ name, image, address, coordinates, phone, email, updateBy: req.user.username });

        logger.info(`Shop created: ${shop.name}`);
        res.status(200).json(shop);
    } catch (error) {
        logger.error(`Shop creation error: ${error.stack}`);
        res.status(500).json({ error: "Failed to create shop" });
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
