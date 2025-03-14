
const { AgentCommission, Stock, Metric, Product, Percentage } = require("../models");
const logger = require("../config/logger");

exports.settleAgentCommission = async (req, res) => {
    try {
        const { stockId, agentId, createdBy } = req.body;

        // ✅ Get Stock
        const stock = await Stock.findByPk(stockId);
        if (!stock) return res.status(404).json({ error: "Stock not found" });

        if (!stock.agentId) return res.status(400).json({ error: "No agent assigned to this stock" });

        // ✅ Get Agent Percentage from Percentages Table
        const agentPercentage = await Percentage.findOne({ where: { key: "agent" } });
        if (!agentPercentage) return res.status(500).json({ error: "Percentage for agent not set" });

        // ✅ Calculate Agent Share
        const totalNetPrice = stock.totalNetPrice;
        const commissionAmount = (totalNetPrice * agentPercentage.value) / 100;

        // ✅ Store Commission in AGENTCOMMISSIONS Table
        const commission = await AgentCommission.create({
            stockId,
            agentId,
            percentage: agentPercentage.value,
            totalNetPrice,
            amount: commissionAmount,
            createdBy
        });

        logger.info(`✅ Agent Commission Settled for Stock: ${stockId}`);
        res.status(201).json(commission);
    } catch (error) {
        logger.error(`❌ Agent Commission Settlement Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to settle agent commission" });
    }
};


exports.getAgentCommissionReport = async (req, res) => {
    const { agentId, startDate, endDate, productId, stockEvent } = req.query;

    try {
        const whereClause = {
            agentId,
            createdAt: {
                [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
            }
        };

        if (stockEvent) whereClause["$Stock.stockEvent$"] = stockEvent;
        if (productId) whereClause["$Stock.Metric.productId$"] = productId;

        const commissions = await AgentCommission.findAll({
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
        logger.error(`❌ Fetching Agent Commission Report Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to fetch report" });
    }
};
