const { AgentCommission, SubAgentCommission, SalesmanCommission,
    ShopCommission, DistributorCommission, ShopAllCommission } = require("../models");

exports.getCommissionSummary = async (req, res) => {
    try {
        const agentTotal = await AgentCommission.sum('amount');
        const subAgentTotal = await SubAgentCommission.sum('amount');
        const salesmanTotal = await SalesmanCommission.sum('amount');
        // const shopTotal = await ShopCommission.sum('amount');
        const shopAllTotal = await ShopAllCommission.sum('amount');
        const distributorTotal = await DistributorCommission.sum('amount');

        res.json({
            agentCommission: agentTotal || 0,
            subAgentCommission: subAgentTotal || 0,
            salesmanCommission: salesmanTotal || 0,
            shopCommission: shopAllTotal || 0,
            distributorCommission: distributorTotal || 0,
            totalCommission: (agentTotal || 0) + (subAgentTotal || 0)
                + (salesmanTotal || 0) + (shopAllTotal || 0) + (distributorTotal || 0),
        });
    } catch (error) {
        console.error("❌ Commission Summary Error:", error);
        res.status(500).json({ error: "Failed to fetch commission summary" });
    }
};


exports.getAgentDetail = async (req, res) => {
    const { agentId, startDate, endDate } = req.query;

    try {
        const data = await AgentCommission.findAll({
            where: {
                agentId,
                createdAt: {
                    [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                }
            },
            include: [
                {
                    model: Stock
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.json(data);
    } catch (error) {
        console.error("❌ Agent Detail Error:", error);
        res.status(500).json({ error: "Failed to fetch agent detail" });
    }
};

exports.getSubAgentDetail = async (req, res) => {
    const { subAgentId, startDate, endDate } = req.query;

    try {
        const data = await SubAgentCommission.findAll({
            where: {
                subAgentId,
                createdAt: {
                    [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                }
            },
            include: [
                {
                    model: Stock
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.json(data);
    } catch (error) {
        console.error("❌ SubAgent Detail Error:", error);
        res.status(500).json({ error: "Failed to fetch sub-agent detail" });
    }
};

exports.getSalesmanDetail = async (req, res) => {
    const { salesId, startDate, endDate } = req.query;

    try {
        const data = await SalesmanCommission.findAll({
            where: {
                salesId,
                createdAt: {
                    [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                }
            },
            include: [
                {
                    model: Stock
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.json(data);
    } catch (error) {
        console.error("❌ Salesman Detail Error:", error);
        res.status(500).json({ error: "Failed to fetch salesman detail" });
    }
};

exports.getShopDetail = async (req, res) => {
    const { shopId, startDate, endDate } = req.query;

    try {
        const data = await ShopCommission.findAll({
            where: {
                shopId,
                createdAt: {
                    [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                }
            },
            include: [
                {
                    model: Stock
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.json(data);
    } catch (error) {
        console.error("❌ Shop Detail Error:", error);
        res.status(500).json({ error: "Failed to fetch shop detail" });
    }
};

