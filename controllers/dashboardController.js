// const { Op } = require("sequelize"); // Import the Operators object from Sequelize
const db = require("../models");
const Sequelize = db.Sequelize;
const { Op } = Sequelize;
const { AgentCommission, SubAgentCommission, SalesmanCommission,
    ShopCommission, DistributorCommission, ShopAllCommission } = require("../models");


exports.getCommissionSummary = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query; // Get dates from query parameters

        // --- Build the where clause for filtering ---
        let whereClause = {};
        const dateColumn = 'createdAt'; // <<< --- IMPORTANT: Change this to your actual date column name!

        if (fromDate && toDate) {
            // Basic validation: Ensure both are provided if one is
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);

            // Optional: More robust date validation can be added here
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                 return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
            }

             // Adjust endDate to include the whole day until 23:59:59.999
            endDate.setHours(23, 59, 59, 999);


            whereClause[dateColumn] = {
                [Op.gte]: startDate, // Greater than or equal to fromDate
                [Op.lte]: endDate    // Less than or equal to toDate (end of day)
            };
        } else if (fromDate || toDate) {
            // If only one date is provided, return an error or decide on default behaviour
            return res.status(400).json({ error: "Please provide both fromDate and toDate for filtering." });
        }
        // If neither fromDate nor toDate is provided, whereClause remains empty {},
        // and the sum will be calculated for all records (original behavior).
        // --- End of building where clause ---


        // --- Prepare options object for sum queries ---
        const queryOptions = { where: whereClause };


        // --- Perform sum queries with the filter applied ---
        const agentTotal = await AgentCommission.sum('amount', queryOptions);
        const subAgentTotal = await SubAgentCommission.sum('amount', queryOptions);
        const salesmanTotal = await SalesmanCommission.sum('amount', queryOptions);
        // const shopTotal = await ShopCommission.sum('amount', queryOptions); // Still commented out
        const shopAllTotal = await ShopAllCommission.sum('amount', queryOptions);
        const distributorTotal = await DistributorCommission.sum('amount', queryOptions);

        // --- Send the response ---
        res.json({
            agentCommission: agentTotal || 0,
            subAgentCommission: subAgentTotal || 0,
            salesmanCommission: salesmanTotal || 0,
            shopCommission: shopAllTotal || 0, // Using shopAllTotal as in original code
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

