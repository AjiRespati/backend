const bcrypt = require('bcryptjs');

const {
    Shop, Refrigerator, Salesman, SubAgent, Agent, User,
} = require("../models");
const logger = require("../config/logger");

exports.createShop = async (req, res) => {
    try {
        const { name, image, address, coordinates, phone, email, salesId, subAgentId, agentId } = req.body;

        // 1. Create Shop User 
        const existingUser = await User.findOne({ where: { username: email } });

        let emailToSave = email;

        if (existingUser && (!emailToSave.includes("@mail.com"))) {
            return res.status(400).json({ message: 'Shop Email/Username already exists' });
        }

        if (existingUser && (emailToSave.includes("@mail.com"))) {
            emailToSave = emailToSave.replace("@mail.com", "@gracia.com");
        }
        const secondStepExistingUser = await User.findOne({ where: { username: emailToSave } });
        if (secondStepExistingUser) {
            emailToSave = emailToSave.replace("@gracia.com", "@gracia.id")
        }
        const thirdStepExistingUser = await User.findOne({ where: { username: emailToSave } });
        if (thirdStepExistingUser) {
            emailToSave = emailToSave.replace("@gracia.id", "@gracia.co.id")
        }
        const fourthStepExistingUser = await User.findOne({ where: { username: emailToSave } });
        if (fourthStepExistingUser) {
            return res.status(400).json({ message: 'Shop Email/Username already exists' });
        }

        const password = "gracia123";
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username: emailToSave,
            password: hashedPassword,
            name,
            email: emailToSave,
            phone,
            address,
            level: 6,
            levelDesc: "Shop",
            status: "active",
            createBy: req.user.username
        });


        // 2. Create Shop
        logger.info(`Shop : ${JSON.stringify(req.body)}`);
        const shop = await Shop.create({
            name, image, address, coordinates, phone, email: emailToSave,
            salesId, subAgentId, agentId, createBy: req.user.username
        });

        logger.info(`Shop created: ${shop.name}`);
        res.status(200).json(shop);
    } catch (error) {
        console.error('Unique Constraint Error:', error.errors[0].message);
        logger.error(`Shop creation error: ${error}`);
        res.status(500).json({ error: error.errors[0].message });
    }
};

exports.getAllShops = async (req, res) => {
    const { fromDate, toDate, status, salesId, subAgentId, agentId, stockEvent, shopId } = req.query;
    try {
        // --- Define the attributes you want from the Refrigerator model ---
        // --- Replace these with the actual attribute names you need ---
        const desiredRefrigeratorAttributes = ['id', 'serialNumber', 'name', 'status', 'description', 'image'];

        const shops = await Shop.findAll({
            include: [
                {
                    model: Refrigerator,
                    // Use the 'attributes' option to select specific fields
                    attributes: desiredRefrigeratorAttributes,
                    // You might need 'required: false' if a Shop might not have any Refrigerators
                    // and you still want to see the Shop in the results.
                    // required: false, // This makes it a LEFT JOIN instead of INNER JOIN
                    required: false,
                },
                { model: Salesman, },
                { model: SubAgent },
                { model: Agent }
            ],
            order: [['updatedAt', 'DESC']], // Sort by updatedAt
        });
        res.json(shops);
    } catch (error) {
        logger.error(`Workspaceing shops error: ${error}`);
        res.status(500).json({ error: "Failed to retrieve shops" });
    }

    // try {
    //     const shops = await Shop.findAll({
    //         include: [{
    //             model: Refrigerator,
    //             //   as: 'Refrigerators', // Optional: Provide an alias for the association
    //         },
    //         { model: Salesman },
    //         { model: SubAgent },
    //         { model: Agent }],
    //         order: [['updatedAt', 'DESC']], // Sort by updatedAt
    //     });
    //     res.json(shops);
    // } catch (error) {
    //     logger.error(`Fetching shops error: ${error}`);
    //     res.status(500).json({ error: "Failed to retrieve shops" });
    // }
};


exports.getAllShopsBySales = async (req, res) => {
    const { id } = req.params;
    try {
        let shops = [];
        const desiredRefrigeratorAttributes = ['id', 'serialNumber', 'name', 'status', 'description', 'image'];
        const salesmanShops = await Shop.findAll({
            where: { salesId: id },
            include: [{
                model: Refrigerator,
                //   as: 'Refrigerators', // Optional: Provide an alias for the association
                attributes: desiredRefrigeratorAttributes,
            }],
        });
        const subAgentShops = await Shop.findAll({
            where: { subAgentId: id },
            include: [{
                model: Refrigerator,
                //   as: 'Refrigerators', // Optional: Provide an alias for the association
                attributes: desiredRefrigeratorAttributes,
            }],
        });
        const agentShops = await Shop.findAll({
            where: { agentId: id },
            include: [{
                model: Refrigerator,
                //   as: 'Refrigerators', // Optional: Provide an alias for the association
                attributes: desiredRefrigeratorAttributes,
            }],
        });

        if (salesmanShops.length > 0) {
            shops = salesmanShops;
        } else if (subAgentShops.length > 0) {
            shops = subAgentShops;
        } else if (agentShops.length > 0) {
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
        const { name, address, coordinates, phone, email, status,
            salesId, subAgentId, agentId
        } = req.body;

        const image = req.imagePath;

        const shop = await Shop.findByPk(id);
        if (!shop) return res.status(404).json({ error: "Shop not found" });

        // Object.assign(shop, { name, image, address, coordinates, phone, email, updateBy: req.user.username });

        shop.name = name || shop.name;
        shop.image = image || shop.image;
        shop.address = address || shop.address;
        shop.coordinates = coordinates || shop.coordinates;
        shop.phone = phone || shop.phone;
        shop.email = email || shop.email;
        shop.status = status || shop.status;
        shop.updateBy = req.user.username;

        if (salesId) {
            shop.salesId = salesId;
        }
        if (subAgentId) {
            shop.subAgentId = subAgentId;
        }
        if (agentId) {
            shop.agentId = agentId;
        }

        await shop.save();

        logger.info(`Shop updated: ${shop.name}`);
        res.json(shop);
    } catch (error) {
        logger.error(`Updating shop error: ${error.stack}`);
        res.status(500).json({ error: "Failed to update shop" });
    }
};
