const { Stock, Percentage, SubAgentCommission, Metric, Product } = require("../models");
const logger = require("../config/logger");

exports.settleSubAgentCommission = async (req, res) => {
    try {
        const { stockId, subAgentId, createdBy } = req.body;

        // ✅ Get Stock
        const stock = await Stock.findByPk(stockId);
        if (!stock) return res.status(404).json({ error: "Stock not found" });

        if (!stock.subAgentId) return res.status(400).json({ error: "No sub-agent assigned to this stock" });

        // ✅ Get SubAgent Percentage from Percentages Table
        const subAgentPercentage = await Percentage.findOne({ where: { key: "subAgent" } });
        if (!subAgentPercentage) return res.status(500).json({ error: "Percentage for sub-agent not set" });

        // ✅ Calculate SubAgent Share
        const totalNetPrice = stock.totalNetPrice;
        const commissionAmount = (totalNetPrice * subAgentPercentage.value) / 100;

        // ✅ Store Commission in SUBAGENTCOMMISSIONS Table
        const commission = await SubAgentCommission.create({
            stockId,
            subAgentId,
            percentage: subAgentPercentage.value,
            totalNetPrice,
            amount: commissionAmount,
            createdBy
        });

        logger.info(`✅ SubAgent Commission Settled for Stock: ${stockId}`);
        res.status(201).json(commission);
    } catch (error) {
        logger.error(`❌ SubAgent Commission Settlement Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to settle sub-agent commission" });
    }
};


exports.getSubAgentCommissionReport = async (req, res) => {
    const { subAgentId, startDate, endDate, productId, stockEvent } = req.query;

    try {
        const whereClause = {
            subAgentId,
            createdAt: {
                [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
            }
        };

        if (stockEvent) whereClause["$Stock.stockEvent$"] = stockEvent;
        if (productId) whereClause["$Stock.Metric.productId$"] = productId;

        const commissions = await SubAgentCommission.findAll({
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
        logger.error(`❌ Fetching SubAgent Commission Report Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to fetch report" });
    }
};
