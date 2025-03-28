const db = require("../models");
const sequelize = db.sequelize;
const { Stock, Metric, Price, Percentage, Shop } = require("../models");
const logger = require("../config/logger");

exports.createStock = async (req, res) => {
    try {
        const { metricId, stockEvent, amount, createdBy, salesId, subAgentId, agentId, shopId, status, description } = req.body;

        let initialAmount = 0;
        const lastStock = await Stock.findOne({ where: { metricId }, order: [["createdAt", "DESC"]] });
        if (lastStock) {
            initialAmount = lastStock.updateAmount ? lastStock.updateAmount : 0;
        }

        const updateAmount = stockEvent === 'stock_in' ? initialAmount + amount : initialAmount - amount;
        if (updateAmount < 0) return res.status(400).json({ message: 'Not enough stock' });

        // ✅ Fetch the latest price for this metric
        const latestPrice = await Price.findOne({ where: { metricId }, order: [["createdAt", "DESC"]] });
        if (!latestPrice) return res.status(400).json({ error: "No price available for this metric" });

        // ✅ Fetch percentage values
        const percentages = await Percentage.findAll();
        const percentageMap = {};
        percentages.forEach(p => { percentageMap[p.key] = p.value; });

        // ✅ Calculate stock values
        const totalPrice = amount * latestPrice.price;
        const totalNetPrice = totalPrice * (100 / percentageMap["supplier"]);

        let totalDistributorShare;
        let totalSalesShare = null;
        let totalSubAgentShare = null;
        let totalAgentShare = null;
        let totalShopShare = null;

        if (salesId) {
            totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["salesman"]) / 100;
            totalSalesShare = totalNetPrice * (percentageMap["salesman"] / 100);
        } else if (subAgentId) {
            totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["subAgent"]) / 100;
            totalSubAgentShare = totalNetPrice * (percentageMap["subAgent"] / 100);
        } else if (agentId) {
            /// kalau agent, tidak perlu bagi ke shop
            totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["agent"]) / 100;
            // totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["agent"]) / 100;

            totalAgentShare = totalNetPrice * (percentageMap["agent"] / 100);
        } else {
            totalDistributorShare = 0;
        }

        if (stockEvent === 'stock_out' && !agentId) {
            totalShopShare = totalNetPrice * (percentageMap["shop"] / 100);
        }

        // ✅ Create Stock Entry
        const stock = await Stock.create({
            metricId, stockEvent, initialAmount, amount, updateAmount, totalPrice, totalNetPrice,
            totalDistributorShare, totalSalesShare, totalSubAgentShare, totalAgentShare, totalShopShare,
            createdBy: req.user.username, salesId, subAgentId, agentId, shopId, status, description
        });

        // ✅ If stock is sold to a Shop, update Salesman/SubAgent stock and create a new stock entry for the Shop
        if (stockEvent === 'stock_out' && shopId) {
            const lastSellerStock = await Stock.findOne({
                where: { metricId, salesId, subAgentId },
                order: [["createdAt", "DESC"]]
            });

            if (lastSellerStock) {
                await lastSellerStock.update({ updateAmount: lastSellerStock.updateAmount - amount });
            }

            await Stock.create({
                metricId,
                stockEvent: 'stock_out',
                initialAmount: 0,
                amount,
                updateAmount: amount,
                totalPrice,
                totalNetPrice,
                totalDistributorShare,
                totalSalesShare,
                totalSubAgentShare,
                totalAgentShare,
                totalShopShare,
                createdBy: req.user.username,
                salesId,
                subAgentId,
                shopId,
                status: "created",
                description: `Stock received from ${salesId ? "Salesman" : "SubAgent"}`
            });

            logger.info(`Stock moved to Shop ${shopId}: ${amount} units`);
        }

        logger.info(`Stock ${stockEvent} created for metric ${metricId}`);
        res.status(201).json(stock);
    } catch (error) {
        logger.error(`Stock creation error: ${error.stack}`);
        res.status(500).json({ error: "Stock creation failed" });
    }
};


exports.stockListByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // ✅ Get all metric IDs for this product
        const metrics = await Metric.findAll({ where: { productId } });
        const metricIds = metrics.map(m => m.id);
        console.log(metricIds);

        const stocks = await Stock.findAll({ where: { metricId: metricIds } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by product error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};

exports.stockListBySales = async (req, res) => {
    try {
        const { salesId } = req.params;
        const stocks = await Stock.findAll({ where: { salesId } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by salesman error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};

exports.stockListBySubAgent = async (req, res) => {
    try {
        const { subAgentId } = req.params;
        const stocks = await Stock.findAll({ where: { subAgentId } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by sub-agent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};

exports.stockListByAgent = async (req, res) => {
    try {
        const { agentId } = req.params;
        const stocks = await Stock.findAll({ where: { agentId } });

        res.json(stocks);
    } catch (error) {
        logger.error(`Fetching stock by agent error: ${error.stack}`);
        res.status(500).json({ error: "Failed to retrieve stock records" });
    }
};

exports.getStockHistory = async (req, res) => {
    const { metricId, fromDate, toDate } = req.query;

    try {
        const query = `
            SELECT 
                s.id AS "stockId",
                p."name" AS "productName",
                m."metricType" AS "measurement", 
                s."createdAt",
                s."stockEvent",
                s."initialAmount",
                s."amount",
                s."updateAmount",
                s."totalPrice",
                s."totalNetPrice",
                s."createdBy",
                COALESCE(sa.name, ag.name, sm.name, sh.name, 'N/A') AS "relatedEntity",
                CASE 
                    WHEN s."salesId" IS NOT NULL THEN 'Salesman'
                    WHEN s."subAgentId" IS NOT NULL THEN 'SubAgent'
                    WHEN s."agentId" IS NOT NULL THEN 'Agent'
                    WHEN s."shopId" IS NOT NULL THEN 'Shop'
                    ELSE 'Unknown'
                END AS "entityType"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            LEFT JOIN "Salesmans" sm ON s."salesId" = sm.id
            LEFT JOIN "SubAgents" sa ON s."subAgentId" = sa.id
            LEFT JOIN "Agents" ag ON s."agentId" = ag.id
            LEFT JOIN "Shops" sh ON s."shopId" = sh.id
            WHERE 
                s."metricId" = :metricId
                AND (:fromDate IS NULL OR s."createdAt" >= :fromDate)
                AND (:toDate IS NULL OR s."createdAt" <= :toDate)
            ORDER BY s."createdAt" DESC;
        `;

        const [results] = await sequelize.query(query, {
            replacements: { metricId, fromDate, toDate }
        });

        res.json(results);
    } catch (error) {
        console.error("❌ Stock History Error:", error);
        res.status(500).json({ error: "Failed to fetch stock history" });
    }
};


exports.getStockTable = async (req, res) => {
    const { fromDate, toDate } = req.query;

    try {
        const query = `
            SELECT 
                p.id AS "productId",
                p.name AS "productName",
                p.image AS "image",
                m.id AS "metricId",
                m."metricType" AS "metricName",
                SUM(CASE WHEN s."stockEvent" = 'stock_in' THEN s.amount ELSE 0 END) AS "totalStockIn",
                SUM(CASE WHEN s."stockEvent" = 'stock_out' THEN s.amount ELSE 0 END) AS "totalStockOut",
                (
                    SELECT s2."createdAt"
                    FROM "Stocks" s2
                    WHERE s2."metricId" = m.id
                    ORDER BY s2."createdAt" DESC
                    LIMIT 1
                ) AS "lastStockUpdate",
                (
                    SELECT s3."updateAmount"
                    FROM "Stocks" s3
                    WHERE s3."metricId" = m.id
                    ORDER BY s3."createdAt" DESC
                    LIMIT 1
                ) AS "latestUpdateAmount"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            WHERE 
                (:fromDate IS NULL OR s."createdAt" >= :fromDate)
                AND (:toDate IS NULL OR s."createdAt" <= :toDate)
            GROUP BY p.id, m.id, p.image
            ORDER BY p."name" ASC, "lastStockUpdate" DESC;
        `;

        const [results] = await sequelize.query(query, {
            replacements: { fromDate, toDate }
        });

        res.json(results);
    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};

