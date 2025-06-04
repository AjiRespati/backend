const { User, Salesman, SubAgent, Agent, Shop } = require('../models');
const db = require("../models");
const sequelize = db.sequelize;

const logger = require('../config/logger');

exports.getAllUsers = async (req, res) => {
    try {
        let data = await User.findAll({
            order: [["createdAt", "DESC"]]
        });

        data.forEach(el => {
            el['password'] = undefined;
        });

        res.json(data);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const data = await User.findByPk(req.params.id);
        if (!data) return res.status(404).json({ error: 'user not found' });
        res.json(data);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const data = await User.create(req.body);
        res.status(200).json(data);
    } catch (error) {
        logger.error(error);
        res.status(400).json({ error: 'Bad Request' });
    }
};

exports.updateUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { level, status } = req.body;

        const existingUser = await User.findByPk(id, { transaction: t });
        if (!existingUser) return res.status(404).json({ error: 'user not found' });

        const { name, image, address, phone, email } = existingUser;

        existingUser.level = level ?? existingUser.level;
        existingUser.status = status ?? existingUser.status;

        const existingSales = await Salesman.findOne({ where: { email }, transaction: t });
        const existingSubAgent = await SubAgent.findOne({ where: { email }, transaction: t });
        const existingAgent = await Agent.findOne({ where: { email }, transaction: t });

        if (level !== null && level !== undefined) {
            existingUser.levelDesc = levelDescList[level];

            switch (level) {
                case 1:
                    if (existingSubAgent) {
                        existingSubAgent.status = 'inactive';
                        await existingSubAgent.save({ transaction: t });
                    }
                    if (existingAgent) {
                        existingAgent.status = 'inactive';
                        await existingAgent.save({ transaction: t });
                    }
                    if (existingSales) {
                        existingSales.status = 'active';
                        await existingSales.save({ transaction: t });
                    } else {
                        await Salesman.create({ name, image, address, phone, email, updateBy: req.user.username }, { transaction: t });
                        logger.info(`Salesman created`);
                    }
                    break;

                case 2:
                    if (existingSales) {
                        existingSales.status = 'inactive';
                        await existingSales.save({ transaction: t });
                    }
                    if (existingAgent) {
                        existingAgent.status = 'inactive';
                        await existingAgent.save({ transaction: t });
                    }
                    if (existingSubAgent) {
                        existingSubAgent.status = 'active';
                        await existingSubAgent.save({ transaction: t });
                    } else {
                        await SubAgent.create({ name, image, address, phone, email, updateBy: req.user.username }, { transaction: t });
                        logger.info(`SubAgent created`);
                    }
                    break;

                case 3:
                    if (existingSales) {
                        existingSales.status = 'inactive';
                        await existingSales.save({ transaction: t });
                    }
                    if (existingSubAgent) {
                        existingSubAgent.status = 'inactive';
                        await existingSubAgent.save({ transaction: t });
                    }
                    if (existingAgent) {
                        existingAgent.status = 'active';
                        await existingAgent.save({ transaction: t });
                    } else {
                        await Agent.create({ name, image, address, phone, email, updateBy: req.user.username }, { transaction: t });
                        logger.info(`Agent created`);
                    }
                    break;

                default:
                    break;
            }
        }

        if (status !== null && status !== undefined && status === 'inactive') {
            if (existingSubAgent) {
                const shop = await Shop.findOne({ where: { subAgentId: existingSubAgent.id }, transaction: t });
                if (shop) {
                    shop.subAgentId = null;
                    await shop.save({ transaction: t });
                }
                existingSubAgent.status = status;
                await existingSubAgent.save({ transaction: t });

            }
            if (existingAgent) {
                const shop = await Shop.findOne({ where: { agentId: existingAgent.id }, transaction: t });
                if (shop) {
                    shop.agentId = null;
                    await shop.save({ transaction: t });
                }
                existingAgent.status = status;
                await existingAgent.save({ transaction: t });
            }
            if (existingSales) {
                const shop = await Shop.findOne({ where: { salesId: existingSales.id }, transaction: t });
                if (shop) {
                    shop.salesId = null;
                    await shop.save({ transaction: t });
                }
                existingSales.status = status;
                await existingSales.save({ transaction: t });
            }
        }

        await existingUser.save({ transaction: t });
        await t.commit();

        logger.info(`User updated: ${id}`);
        res.json(existingUser);

    } catch (error) {
        await t.rollback();
        logger.error(error);
        res.status(400).json({ error: 'Bad Request' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const data = await User.findByPk(req.params.id);
        if (!data) return res.status(404).json({ error: 'user not found' });

        await data.destroy();
        res.json({ message: 'user deleted successfully' });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const levelDescList = [
    "New User",
    "Salesman",
    "Sub Agent",
    "Agent",
    "Admin",
    "Owner",
    "Shop"
];