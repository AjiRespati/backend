const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    User, Salesman, SubAgent, Agent, Shop,
    SalesmanCommission, SubAgentCommission, AgentCommission,
    DistributorCommission, ShopAllCommission,
    StockBatch, Stock, Price, Metric, Product
} = require("../models");
const logger = require('../config/logger');

exports.register = async (req, res) => {
    try {
        const { username, password, name, email, phone, address, level, updateBy } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        await User.create({
            username,
            password: hashedPassword,
            name,
            email,
            phone,
            address,
            level,
            updateBy
        });

        res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        logger.error(error.message, { stack: error.stack });
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(402).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '4h' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        // Store refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();
        logger.info("✅ User " + username + " login successfully.");

        let salesId = null;
        let subAgentId = null;
        let agentId = null;

        switch (user.level) {
            case 1:
                const existingSales = await Salesman.findOne({
                    where: { email: user.email }
                })
                if (!existingSales) return res.status(404).json({ error: 'sales not found' });

                salesId = existingSales.id;

                break;
            case 2:
                const existingSubAgent = await SubAgent.findOne({
                    where: { email: user.email }
                })
                if (!existingSubAgent) return res.status(404).json({ error: 'subagent not found' });

                subAgentId = existingSubAgent.id;

                break;
            case 3:
                const existingAgent = await Agent.findOne({
                    where: { email: user.email }
                })
                if (!existingAgent) return res.status(404).json({ error: 'sales not found' });

                agentId = existingAgent.id;

                break;

            default:
                break;
        }
        res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            image: user.image,
            address: user.address,
            phone: user.phone,
            email: user.email,
            level: user.level,
            salesId: salesId,
            subAgentId: subAgentId,
            agentId: agentId,
            levelDesc: user.levelDesc,
            accessToken,
            refreshToken
        });
        // res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(403).json({ message: 'Refresh token required' });

        // Find user with this refresh token
        const user = await User.findOne({ where: { refreshToken } });
        if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

        // Verify token
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Token expired or invalid' });

            const newAccessToken = jwt.sign({ id: decoded.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '4h' });
            res.json({ accessToken: newAccessToken });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

        // Remove refresh token from DB
        const user = await User.findOne({ where: { refreshToken } });
        if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

        user.refreshToken = null;
        await user.save();

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.self = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(403).json({ message: 'Refresh token required' });

        // Remove refresh token from DB
        const user = await User.findOne({ where: { refreshToken } });
        if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

        let salesId = null;
        let subAgentId = null;
        let agentId = null;
        let shopId = null;

        switch (user.level) {
            case 1:
                const existingSales = await Salesman.findOne({
                    where: { email: user.email }
                })
                if (!existingSales) return res.status(404).json({ error: 'sales not found' });

                salesId = existingSales.id;

                break;
            case 2:
                const existingSubAgent = await SubAgent.findOne({
                    where: { email: user.email }
                })
                if (!existingSubAgent) return res.status(404).json({ error: 'subagent not found' });

                subAgentId = existingSubAgent.id;

                break;
            case 3:
                const existingAgent = await Agent.findOne({
                    where: { email: user.email }
                })
                if (!existingAgent) return res.status(404).json({ error: 'sales not found' });

                agentId = existingAgent.id;

                break;
            case 6:
                const existingShop = await Shop.findOne({
                    where: { email: user.email }
                })
                if (!existingShop) return res.status(404).json({ error: 'shop not found' });

                shopId = existingShop.id;
                salesId = existingShop.salesId;
                subAgentId = existingShop.subAgentId;
                agentId = existingShop.agentId;

                break;

            default:
                break;
        }

        res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            image: user.image,
            address: user.address,
            phone: user.phone,
            email: user.email,
            level: user.level,
            salesId: salesId,
            subAgentId: subAgentId,
            agentId: agentId,
            shopId: shopId,
            levelDesc: user.levelDesc,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const { newPass } = req.body;

        console.log("✅ User: ", JSON.stringify(req.user))

        const user = await User.findByPk(req.user.id);
        const hashedPassword = await bcrypt.hash(newPass, 10);

        user.password = hashedPassword;
        await user.save();
        res.json("success");
    } catch (err) {

    }
};


// Ini Untuk Hapus DB
exports.generic = async (req, res) => {
    try {
        const { table } = req.body;
        if (!table) return res.status(403).json({ message: 'Table required' });
        switch (table) {
            case "User":
                await User.destroy({
                    truncate: true
                });
                break;
            case "Salesman":
                await Salesman.destroy({
                    truncate: true
                });
                break;
            case "SubAgent":
                await SubAgent.destroy({
                    truncate: true
                });
                break;
            case "Agent":
                await Agent.destroy({
                    truncate: true
                });
                break;
            case "Shop":
                await Shop.destroy({
                    truncate: true
                });
                break;
            case "SalesmanCommission":
                await SalesmanCommission.destroy({
                    truncate: true
                });
                break;
            case "SubAgentCommission":
                await SubAgentCommission.destroy({
                    truncate: true
                });
                break;
            case "AgentCommission":
                await AgentCommission.destroy({
                    truncate: true
                });
                break;
            case "DistributorCommission":
                await DistributorCommission.destroy({
                    truncate: true
                });
                break;
            case "ShopAllCommission":
                await ShopAllCommission.destroy({
                    truncate: true
                });
                break;
            case "StockBatch":
                await StockBatch.truncate({
                    cascade: true
                });
                break;
            case "Stock":
                await Stock.truncate({
                    cascade: true
                });
                break;
            case "Price":
                await Price.destroy({
                    truncate: true
                });
                break;
            case "Metric":
                await Metric.destroy({
                    truncate: true
                });
                break;
            case "Product":
                await Product.truncate({
                    cascade: true
                });
                break;
            default:
                break;
        }

        res.json({ message: `Success remove: ${table}` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed removing: ${table}, ${error}` });
    }
};
