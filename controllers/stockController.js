const db = require("../models");
const sequelize = db.sequelize;
const Sequelize = db.Sequelize;
const { Op } = Sequelize;
const { Stock, Metric, Product, Price, Percentage, SalesmanCommission, SubAgentCommission,
    AgentCommission, DistributorCommission, ShopAllCommission } = require("../models");
const logger = require("../config/logger");



// --- Helper Function for Single Stock Creation Logic ---
// Extracts the core logic from createStock, making it reusable and testable
// Takes transaction item data and the database transaction object
async function _internalCreateSingleStock(itemData, transaction, username) {
    const { metricId, stockEvent, amount, salesId, subAgentId, agentId, shopId, status, description } = itemData;

    let initialAmount = null;
    // Find last settled stock WITHIN the same transaction for consistency
    const lastStock = await Stock.findOne({
        where: { metricId, status: "settled" }, // Or adjust status logic if needed
        order: [["createdAt", "DESC"]],
        transaction // Use the transaction
    });
    if (lastStock) {
        // Logic might need refinement depending on how stock_in/out affect each other within a batch
        // For simplicity assuming stock_in updates based on last settled state before the batch
        initialAmount = lastStock.updateAmount; // Assume stock_in always uses the last settled amount
    }

    // Determine updateAmount based on current item's event type
    const updateAmount = stockEvent === 'stock_in'
        ? (initialAmount !== null ? initialAmount : 0) + amount // Handle case where initialAmount might be null
        : (initialAmount !== null ? initialAmount : 0) - amount; // Assuming stock_out decreases


    // Fetch the latest price for this metric WITHIN the same transaction
    const latestPrice = await Price.findOne({
        where: { metricId },
        order: [["createdAt", "DESC"]],
        transaction // Use the transaction
    });

    if (!latestPrice) {
        // If price is missing, throw an error to rollback the whole transaction
        throw new Error(`No price available for metricId ${metricId}`);
    }

    // Calculate stock values based on the current item
    const totalPrice = amount * latestPrice.price;
    const totalNetPrice = amount * latestPrice.netPrice;
    const salesmanPrice = salesId ? amount * latestPrice.salesmanPrice : 0;
    const subAgentPrice = subAgentId ? amount * latestPrice.subAgentPrice : 0;
    const agentPrice = agentId ? amount * latestPrice.agentPrice : 0;

    // Placeholder values - commissions might need separate calculation/logic
    let totalDistributorShare = 0;
    let totalSalesShare = null;
    let totalSubAgentShare = null;
    let totalAgentShare = null;
    let totalShopShare = null;

    // Create Stock Entry WITHIN the same transaction
    const stock = await Stock.create({
        metricId,
        stockEvent,
        initialAmount,
        amount,
        updateAmount,
        totalPrice,
        totalNetPrice,
        salesmanPrice,
        subAgentPrice,
        agentPrice,
        totalDistributorShare,
        totalSalesShare,
        totalSubAgentShare,
        totalAgentShare,
        totalShopShare,
        createdBy: username, // Pass username from request
        salesId,
        subAgentId,
        agentId,
        shopId,
        status: "created", // Or apply your status logic ('settled'?)
        description
    }, { transaction }); // Pass the transaction object

    return stock; // Return the created stock record
}


// --- New Batch Controller Function ---
exports.createStockBatch = async (req, res) => {
    // Start a Sequelize managed transaction
    const transaction = await sequelize.transaction();
    try {
        // Expect an array of transactions in the request body, e.g., { transactions: [...] }
        const { transactions } = req.body;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            await transaction.rollback(); // Rollback before sending error
            return res.status(400).json({ error: "Request body must contain a non-empty 'transactions' array." });
        }

        const createdStocks = [];
        const errors = [];

        // Use Promise.all for concurrent processing within the transaction (optional, can use sequential for...of loop too)
        await Promise.all(transactions.map(async (item) => {
            // Call the internal helper for each item
            const newStock = await _internalCreateSingleStock(item, transaction, req.user.username);
            createdStocks.push(newStock);
        }));

        // If using sequential loop:
        // for (const item of transactions) {
        //     try {
        //         const newStock = await _internalCreateSingleStock(item, transaction, req.user.username);
        //         createdStocks.push(newStock);
        //     } catch (itemError) {
        //          // Log specific item error - the main catch block will handle rollback
        //         logger.error(`Error processing item ${item.metricId}: ${itemError.message}`);
        //         // Re-throw the error to ensure the transaction rolls back
        //          throw itemError;
        //     }
        // }


        // If all items were processed without error, commit the transaction
        await transaction.commit();
        logger.info(`${createdStocks.length} stock entries created successfully in batch.`);
        res.status(201).json({ message: "Batch stock creation successful", data: createdStocks });

    } catch (error) {
        // If any error occurred during the process (incl. _internalCreateSingleStock), rollback the transaction
        await transaction.rollback();
        logger.error(`Batch stock creation failed: ${error.stack}`);
        // Provide a more specific error message if possible (e.g., from the caught error)
        res.status(500).json({ error: "Batch stock creation failed", details: error.message });
    }
};



exports.createStock = async (req, res) => {
    try {
        const { metricId, stockEvent, amount, salesId, subAgentId, agentId, shopId, status, description } = req.body;

        let initialAmount = null;
        const lastStock = await Stock.findOne({ where: { metricId, status: "settled" }, order: [["createdAt", "DESC"]] });
        if (lastStock) {
            initialAmount = lastStock.updateAmount && stockEvent === 'stock_in' ? lastStock.updateAmount : null;
        }

        const updateAmount = stockEvent === 'stock_in' ? initialAmount + amount : null;

        // ✅ Fetch the latest price for this metric
        const latestPrice = await Price.findOne({ where: { metricId }, order: [["createdAt", "DESC"]] });
        if (!latestPrice) return res.status(400).json({ error: "No price available for this metric" });

        // ✅ Calculate stock values
        const totalPrice = amount * latestPrice.price;
        const totalNetPrice = amount * latestPrice.netPrice;
        const salesmanPrice = salesId ? amount * latestPrice.salesmanPrice : 0;
        const subAgentPrice = subAgentId ? amount * latestPrice.subAgentPrice : 0;
        const agentPrice = agentId ? amount * latestPrice.agentPrice : 0;

        let totalDistributorShare = 0;
        let totalSalesShare = null;
        let totalSubAgentShare = null;
        let totalAgentShare = null;
        let totalShopShare = null;

        // ✅ Create Stock Entry
        const stock = await Stock.create({
            metricId,
            stockEvent,
            initialAmount,
            amount,
            updateAmount,
            totalPrice,
            totalNetPrice,
            salesmanPrice,
            subAgentPrice,
            agentPrice,
            totalDistributorShare,
            totalSalesShare,
            totalSubAgentShare,
            totalAgentShare,
            totalShopShare,
            createdBy: req.user.username,
            salesId,
            subAgentId,
            agentId,
            shopId,
            status: "created",
            // status: stockEvent === 'stock_in' ? "settled" : "created",
            description
        });

        logger.info(`Stock ${stockEvent} created for metric ${metricId}`);
        res.status(200).json(stock);
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
    const { metricId, fromDate, toDate, status } = req.query;

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
                s."agentPrice",
                s."subAgentPrice",
                s."salesmanPrice",
                s."totalDistributorShare",
                s."totalSalesShare",
                s."totalSubAgentShare",
                s."totalAgentShare",
                s."totalShopShare",
                s."status",
                s."description",
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
                AND (s."status" = :status)
            ORDER BY s."createdAt" DESC;
        `;

        const [results] = await sequelize.query(query, {
            replacements: { metricId, fromDate, toDate, status }
        });

        res.json(results);
    } catch (error) {
        console.error("❌ Stock History Error:", error);
        res.status(500).json({ error: "Failed to fetch stock history" });
    }
};


exports.getStockTable = async (req, res) => {
    const { fromDate, toDate, status, salesId, subAgentId, agentId } = req.query;

    // Ensure that optional parameters default to null if they are missing (undefined)
    // This ensures the replacements object will always have these keys defined.
    const reqSalesId = salesId || null;
    const reqSubAgentId = subAgentId || null;
    const reqAgentId = agentId || null;

    try {
        const query = `
            SELECT 
                p.id AS "productId",
                p.name AS "productName",
                p.image AS "image",
                m.id AS "metricId",
                m."metricType" AS "metricName",
            --    s."totalPrice" AS "basicPrice",
            --    s."agentPrice" AS "agentPrice",
            --    s."subAgentPrice" AS "subAgentPrice",
            --    s."salesmanPrice" AS "salesmanPrice",
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
                    WHERE s3."metricId" = m.id AND s3."status" = 'settled'
                    ORDER BY s3."createdAt" DESC
                    LIMIT 1
                ) AS "latestUpdateAmount"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            WHERE 
                (:fromDate IS NULL OR s."createdAt" >= :fromDate)
                AND (:toDate IS NULL OR s."createdAt" <= :toDate)
                AND (:salesId IS NULL OR s."salesId" = :salesId)
                AND (:subAgentId IS NULL OR s."subAgentId" = :subAgentId)
                AND (:agentId IS NULL OR s."agentId" = :agentId)
                AND (s."status" = :status)
            GROUP BY p.id, m.id, p.image -- , s."totalPrice", s."agentPrice", s."subAgentPrice", s."salesmanPrice"
            ORDER BY p."name" ASC, "lastStockUpdate" DESC;
        `;

        const [results] = await sequelize.query(query, {
            replacements: {
                fromDate,
                toDate,
                status,
                salesId: reqSalesId,
                subAgentId: reqSubAgentId,
                agentId: reqAgentId
            }
        });

        res.json(results);
    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};


exports.getStockClientTable = async (req, res) => {
    const { fromDate, toDate, status, salesId, subAgentId, agentId, stockEvent, shopId } = req.query;

    // Ensure that optional parameters default to null if they are missing (undefined)
    // This ensures the replacements object will always have these keys defined.
    const reqSalesId = salesId || null;
    const reqSubAgentId = subAgentId || null;
    const reqAgentId = agentId || null;
    const reqShopId = shopId || null;
    const reqStockEvent = stockEvent || null;

    try {
        const query = `
            SELECT 
                s.id AS "stockId",
                p."name" AS "productName",
                p.image AS "image",
                m."metricType" AS "measurement",
                s."metricId",
                s."stockEvent",
                s."amount",
                s."updateAmount",
                s."totalPrice",
                s."totalNetPrice",
                s."agentPrice",
                s."subAgentPrice",
                s."salesmanPrice",
                s."totalDistributorShare",
                s."totalSalesShare",
                s."totalSubAgentShare",
                s."totalAgentShare",
                s."totalShopShare",
                s."status",
                s."description",
                s."createdBy",
                COALESCE(sa.name, ag.name, sm.name, sh.name, 'N/A') AS "relatedEntity",
                CASE 
                    WHEN s."salesId" IS NOT NULL THEN 'Salesman'
                    WHEN s."subAgentId" IS NOT NULL THEN 'SubAgent'
                    WHEN s."agentId" IS NOT NULL THEN 'Agent'
                    WHEN s."shopId" IS NOT NULL THEN 'Shop'
                    ELSE 'Unknown'
                END AS "entityType",
                sh."name" AS "shopName"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            LEFT JOIN "Salesmans" sm ON s."salesId" = sm.id
            LEFT JOIN "SubAgents" sa ON s."subAgentId" = sa.id
            LEFT JOIN "Agents" ag ON s."agentId" = ag.id
            LEFT JOIN "Shops" sh ON s."shopId" = sh.id
            WHERE 
                s."status" = :status
                AND (:fromDate IS NULL OR s."createdAt" >= :fromDate)
                AND (:toDate IS NULL OR s."createdAt" <= :toDate)
                AND (:salesId IS NULL OR s."salesId" = :salesId)
                AND (:subAgentId IS NULL OR s."subAgentId" = :subAgentId)
                AND (:agentId IS NULL OR s."agentId" = :agentId)
                AND (:shopId IS NULL OR s."shopId" = :shopId)
                AND (:stockEvent IS NULL OR s."stockEvent" = :stockEvent)
            ORDER BY s."createdAt" DESC;
        `;

        const [results] = await sequelize.query(query, {
            replacements: {
                fromDate,
                toDate,
                status,
                salesId: reqSalesId,
                subAgentId: reqSubAgentId,
                agentId: reqAgentId,
                shopId: reqShopId,
                stockEvent: reqStockEvent
            }
        });

        res.json(results);
    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};


exports.settlingStock = async (req, res) => {
    try {
        const { id, metricId } = req.body;

        // Find stock entry with 'created' status
        let stock = await Stock.findOne({ where: { id, status: "created" } });

        if (!stock) {
            return res.status(404).json({ message: "Stock entry not found or already settled" });
        }

        let stockEvent = stock.stockEvent;
        let amount = stock.amount;
        let initialAmount = 0;
        const lastStock = await Stock.findOne({
            where: { metricId, status: "settled" },
            order: [["createdAt", "DESC"]]
        });

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
        let distributorPercentage = 0;

        // ✅ Calculate stock values
        const totalPrice = amount * latestPrice.price;
        const totalNetPrice = totalPrice * (100 / percentageMap["supplier"]);

        let totalDistributorShare;
        let totalSalesShare = null;
        let totalSubAgentShare = null;
        let totalAgentShare = null;
        let totalShopShare = null;

        if (stock.salesId) {
            distributorPercentage = 100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["salesman"];
            totalDistributorShare = totalNetPrice * distributorPercentage / 100;
            totalSalesShare = totalNetPrice * (percentageMap["salesman"] / 100);
        } else if (stock.subAgentId) {
            distributorPercentage = 100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["subAgent"];
            totalDistributorShare = totalNetPrice * distributorPercentage / 100;
            totalSubAgentShare = totalNetPrice * (percentageMap["subAgent"] / 100);
        } else if (stock.agentId) {
            /// kalau agent, tidak perlu bagi ke shop
            distributorPercentage = 100 - percentageMap["supplier"] - percentageMap["agent"];
            totalDistributorShare = totalNetPrice * distributorPercentage / 100;
            // totalDistributorShare = totalNetPrice * (100 - percentageMap["supplier"] - percentageMap["shop"] - percentageMap["agent"]) / 100;

            totalAgentShare = totalNetPrice * (percentageMap["agent"] / 100);
        } else {
            totalDistributorShare = 0;
        }

        if (stockEvent === 'stock_out') {
            // ✅ Pastikan apakah shop commission selalu 20% (termasuk dari Agent).
            totalShopShare = totalNetPrice * (percentageMap["shop"] / 100);
        }

        // if (stockEvent === 'stock_out' && !stock.agentId) {
        //     totalShopShare = totalNetPrice * (percentageMap["shop"] / 100);
        // }

        // Update stock fields
        stock.status = "settled";
        stock.initialAmount = initialAmount;
        stock.updateAmount = updateAmount;
        stock.totalSalesShare = totalSalesShare;
        stock.totalDistributorShare = totalDistributorShare;
        stock.totalSubAgentShare = totalSubAgentShare;
        stock.totalAgentShare = totalAgentShare;
        stock.totalShopShare = totalShopShare;

        // Save updated stock entry
        await stock.save();

        if (stock.salesId) {

            // ✅ Store Commission in SALESMANCOMMISSIONS Table
            await SalesmanCommission.create({
                stockId: id,
                salesId: stock.salesId,
                percentage: percentageMap["salesman"],
                totalNetPrice,
                amount: totalSalesShare,
                createdBy: req.user.username
            });

        } else if (stock.subAgentId) {

            // ✅ Store Commission in SubAgentCommission Table
            await SubAgentCommission.create({
                stockId: id,
                subAgentId: stock.subAgentId,
                percentage: percentageMap["subAgent"],
                totalNetPrice,
                amount: totalSubAgentShare,
                createdBy: req.user.username
            });

        } else if (stock.agentId) {

            // ✅ Store Commission in AgentCommission Table
            await AgentCommission.create({
                stockId: id,
                agentId: stock.agentId,
                percentage: percentageMap["agent"],
                totalNetPrice,
                amount: totalAgentShare,
                createdBy: req.user.username
            });

        }

        if (totalDistributorShare) {
            // ✅ Store Distributor Commission in DistributorCommission Table
            await DistributorCommission.create({
                stockId: id,
                percentage: distributorPercentage,
                totalNetPrice,
                amount: totalDistributorShare,
                createdBy: req.user.username
            });
        }


        if (stock.salesId || stock.subAgentId || stock.agentId) {
            // ✅ Store All Shop Commission in ShopAllCommission Table
            await ShopAllCommission.create({
                stockId: id,
                salesId: stock.salesId,
                subAgentId: stock.subAgentId,
                agentId: stock.agentId,
                percentage: percentageMap["shop"],
                totalNetPrice,
                amount: totalShopShare,
                createdBy: req.user.username
            });

        }

        return res.status(200).json({ message: "Stock status updated successfully", stock });
    } catch (error) {
        console.error("Error updating stock status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


exports.cancelingStock = async (req, res) => {
    try {
        const { id, description } = req.body;

        // Find stock entry with 'created' status
        let stock = await Stock.findOne({ where: { id, status: "created" } });

        if (!stock) {
            return res.status(404).json({ message: "Stock entry not found or already settled" });
        }

        // Update stock fields
        stock.status = "canceled";
        stock.description = description;

        // Save updated stock entry
        await stock.save();

        return res.status(200).json({ message: "Stock status canceled successfully", stock });
    } catch (error) {
        console.error("Error canceling stock status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


exports.getStockResume = async (req, res) => {
    const { fromDate, toDate, salesId, subAgentId, agentId, shopId } = req.body;

    try {
        let whereClause = {
            createdAt: {
                [Op.between]: [new Date(fromDate), new Date(toDate)]
            }
        };
        if (salesId) {
            whereClause['salesId'] = salesId;
        }
        if (subAgentId) {
            whereClause['subAgentId'] = subAgentId;
        }
        if (agentId) {
            whereClause['agentId'] = agentId;
        }
        if (shopId) {
            whereClause['shopId'] = shopId;
        }


        const stockResume = await Stock.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
                [sequelize.fn('SUM', sequelize.col('salesmanPrice')), 'totalNetSalesman'],
                [sequelize.fn('SUM', sequelize.col('subAgentPrice')), 'totalNetSubAgent'],
                [sequelize.fn('SUM', sequelize.col('agentPrice')), 'totalNetAgent'],
                [sequelize.fn('SUM', sequelize.col('totalSalesShare')), 'totalSalesmanCommission'],
                [sequelize.fn('SUM', sequelize.col('totalSubAgentShare')), 'totalSubAgentCommission'],
                [sequelize.fn('SUM', sequelize.col('totalAgentShare')), 'totalAgentCommission'],
                [sequelize.fn('SUM', sequelize.col('totalShopShare')), 'totalShopAllCommission'],
                [sequelize.fn('SUM', sequelize.col('totalNetPrice')), 'totalNetPriceSum'],
            ],
            raw: true
        });

        // const salesmanCommissions = await SalesmanCommission.findAll({
        //     where: whereClause,
        //     attributes: [
        //         [sequelize.fn('SUM', sequelize.col('amount')), 'totalSalesmanCommission']
        //     ],
        //     raw: true
        // });

        // const shopAllCommissions = await ShopAllCommission.findAll({
        //     where: whereClause,
        //     attributes: [
        //         [sequelize.fn('SUM', sequelize.col('amount')), 'totalShopAllCommission']
        //     ],
        //     raw: true
        // });

        return res.status(200).json({
            totalAmount: stockResume[0]?.totalAmount || 0,
            totalNetPriceSum: stockResume[0]?.totalNetPriceSum || 0,
            totalNetSalesmanSum: stockResume[0]?.totalNetSalesman || 0,
            totalNetSubAgentSum: stockResume[0]?.totalNetSubAgent || 0,
            totalNetAgentSum: stockResume[0]?.totalNetAgent || 0,
            totalSalesmanCommission: stockResume[0]?.totalSalesmanCommission || 0,
            totalSubAgentCommission: stockResume[0]?.totalSubAgentCommission || 0,
            totalAgentCommission: stockResume[0]?.totalAgentCommission || 0,
            totalShopAllCommission: stockResume[0]?.totalShopAllCommission || 0
        });

    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};


exports.getTableBySalesId = async (req, res) => {
    const { fromDate, toDate, salesId } = req.body;

    try {
        const query = `
            SELECT 
                s.id,
                s.amount,
                s."salesmanPrice",
                s."totalSalesShare",
                -- s."totalNetPrice",
                s.status,
                s."updatedAt",
                p.name AS "productName",
                m."metricType",
                sh."name" AS "shopName"
                -- pr."netPrice",
                -- sc.amount AS "salesmanCommission",
                -- sac.amount AS "shopAllCommission"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            LEFT JOIN "Shops" sh ON s."shopId" = sh.id
            --  LEFT JOIN (
            --      SELECT DISTINCT ON ("metricId") "metricId", "netPrice" 
            --      FROM "Prices" 
            --      ORDER BY "metricId", "createdAt" DESC
            --  ) pr ON m.id = pr."metricId"
            --  LEFT JOIN "SalesmanCommissions" sc ON s.id = sc."stockId"
            --  LEFT JOIN "ShopAllCommissions" sac ON s.id = sac."stockId"
            WHERE s."salesId" = :salesId
            AND s."createdAt" BETWEEN :fromDate AND :toDate
            ORDER BY s."createdAt" DESC
        `;

        const stocks = await sequelize.query(query, {
            replacements: {
                salesId,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate)
            },
            type: sequelize.QueryTypes.SELECT
        });

        return res.status(200).json(stocks);

    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};



exports.getTableBySalesId = async (req, res) => {
    const { fromDate, toDate, salesId } = req.body;

    try {
        const query = `
            SELECT 
                s.id,
                s.amount,
                s."salesmanPrice",
                s."totalSalesShare",
                -- s."totalNetPrice",
                s.status,
                s."updatedAt",
                p.name AS "productName",
                m."metricType",
                sh."name" AS "shopName"
                -- pr."netPrice",
                -- sc.amount AS "salesmanCommission",
                -- sac.amount AS "shopAllCommission"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            LEFT JOIN "Shops" sh ON s."shopId" = sh.id
            --  LEFT JOIN (
            --      SELECT DISTINCT ON ("metricId") "metricId", "netPrice" 
            --      FROM "Prices" 
            --      ORDER BY "metricId", "createdAt" DESC
            --  ) pr ON m.id = pr."metricId"
            --  LEFT JOIN "SalesmanCommissions" sc ON s.id = sc."stockId"
            --  LEFT JOIN "ShopAllCommissions" sac ON s.id = sac."stockId"
            WHERE s."salesId" = :salesId
            AND s."createdAt" BETWEEN :fromDate AND :toDate
            ORDER BY s."createdAt" DESC
        `;

        const stocks = await sequelize.query(query, {
            replacements: {
                salesId,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate)
            },
            type: sequelize.QueryTypes.SELECT
        });

        return res.status(200).json(stocks);

    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};



exports.getTableByShopId = async (req, res) => {
    const { fromDate, toDate, shopId } = req.body;

    try {
        const query = `
            SELECT 
                s.id,
                s.amount,
                s."totalNetPrice",
                s."totalShopShare",
                s.status,
                s."updatedAt",
                p.name AS "productName",
                m."metricType",
                sh."name" AS "shopName"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            LEFT JOIN "Shops" sh ON s."shopId" = sh.id
            WHERE s."shopId" = :shopId
            AND s."createdAt" BETWEEN :fromDate AND :toDate
            ORDER BY s."createdAt" DESC
        `;

        const stocks = await sequelize.query(query, {
            replacements: {
                shopId,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate)
            },
            type: sequelize.QueryTypes.SELECT
        });

        return res.status(200).json(stocks);

    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};


exports.getTableBySalesIdxxx = async (req, res) => {
    const { fromDate, toDate, salesId } = req.body;

    try {
        const query = `
            SELECT 
                s.id,
                s.amount,
                s."salesmanPrice",
                s."totalSalesShare",
                -- s."totalNetPrice",
                s.status,
                s."updatedAt",
                p.name AS "productName",
                m."metricType",
                sh."name" AS "shopName"
                -- pr."netPrice",
                -- sc.amount AS "salesmanCommission",
                -- sac.amount AS "shopAllCommission"
            FROM "Stocks" s
            LEFT JOIN "Metrics" m ON s."metricId" = m.id
            LEFT JOIN "Products" p ON m."productId" = p.id
            LEFT JOIN "Shops" sh ON s."shopId" = sh.id
            --  LEFT JOIN (
            --      SELECT DISTINCT ON ("metricId") "metricId", "netPrice" 
            --      FROM "Prices" 
            --      ORDER BY "metricId", "createdAt" DESC
            --  ) pr ON m.id = pr."metricId"
            --  LEFT JOIN "SalesmanCommissions" sc ON s.id = sc."stockId"
            --  LEFT JOIN "ShopAllCommissions" sac ON s.id = sac."stockId"
            WHERE s."salesId" = :salesId
            AND s."createdAt" BETWEEN :fromDate AND :toDate
            ORDER BY s."createdAt" DESC
        `;

        const stocks = await sequelize.query(query, {
            replacements: {
                salesId,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate)
            },
            type: sequelize.QueryTypes.SELECT
        });

        return res.status(200).json(stocks);

    } catch (error) {
        console.error("❌ Stock Table Error:", error);
        res.status(500).json({ error: "Failed to fetch stock table" });
    }
};

