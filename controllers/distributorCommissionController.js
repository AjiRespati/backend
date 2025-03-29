const { Stock, Percentage, DistributorCommission, Metric, Product } = require("../models");
const logger = require("../config/logger");

exports.settleDistributorCommission = async (req, res) => {
    try {
        const { stockId, salesId, createdBy } = req.body;

        // ✅ Get Stock
        const stock = await Stock.findByPk(stockId);
        if (!stock) return res.status(404).json({ error: "Stock not found" });

        if (!stock.salesId) return res.status(400).json({ error: "No Distributor assigned to this stock" });

        // ✅ Get Distributor Percentage from Percentages Table
        const salesPercentage = await Percentage.findOne({ where: { key: "Distributor" } });
        if (!salesPercentage) return res.status(500).json({ error: "Percentage for Distributor not set" });

        // ✅ Calculate Distributor Share
        const totalNetPrice = stock.totalNetPrice;
        const commissionAmount = (totalNetPrice * salesPercentage.value) / 100;

        // ✅ Store Commission in DistributorCOMMISSIONS Table
        const commission = await DistributorCommission.create({
            stockId,
            salesId,
            percentage: salesPercentage.value,
            totalNetPrice,
            amount: commissionAmount,
            createdBy: req.user.username
        });

        logger.info(`✅ Distributor Commission Settled for Stock: ${stockId}`);
        res.status(201).json(commission);
    } catch (error) {
        logger.error(`❌ Distributor Commission Settlement Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to settle Distributor commission" });
    }
};

exports.getDistributorCommissionReport = async (req, res) => {
    const { salesId, startDate, endDate, productId, stockEvent } = req.query;

    try {
        const whereClause = {
            salesId,
            createdAt: {
                [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
            }
        };

        if (stockEvent) whereClause["$Stock.stockEvent$"] = stockEvent;
        if (productId) whereClause["$Stock.Metric.productId$"] = productId;

        const commissions = await DistributorCommission.findAll({
            where: whereClause,
            include: [
                {
                    model: Stock,
                    include: [
                        {
                            model: Metric,
                            include: {
                                model: Product
                            }
                        }
                    ]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.json(commissions);
    } catch (error) {
        logger.error(`❌ Fetching Distributor Commission Report Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to fetch report" });
    }
};

