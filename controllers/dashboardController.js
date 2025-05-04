// const { Op } = require("sequelize"); // Import the Operators object from Sequelize
const db = require("../models");
const Sequelize = db.Sequelize;
const { Op } = Sequelize;
const { AgentCommission, SubAgentCommission, SalesmanCommission,
    ShopCommission, DistributorCommission, ShopAllCommission,
    Stock, StockBatch, Metric, Product, Shop
} = require("../models");


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

exports.getComDetailByClient = async (req, res) => {
    const { clientType, id, startDate, endDate } = req.query;
    let data;

    const attributes = [
        'id',
        'amount',
        'totalSalesShare',
        'totalSubAgentShare',
        'totalAgentShare',
        'totalShopShare',
        'salesId',
        'subAgentId',
        'agentId',
        'shopId',
        'settledBy',
        'updatedAt',
    ];
    try {
        switch (clientType) {
            case 'salesman':
                data = await SalesmanCommission.findAll({
                    where: {
                        salesId: id,
                        createdAt: {
                            [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                        }
                    },
                    include: [
                        { model: Stock, attributes }
                    ],
                    order: [["createdAt", "DESC"]]
                });
                break;
            case 'subAgent':
                data = await SubAgentCommission.findAll({
                    where: {
                        subAgentId: id,
                        createdAt: {
                            [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                        }
                    },
                    include: [
                        { model: Stock, attributes }
                    ],
                    order: [["createdAt", "DESC"]]
                });
                data.totalSalesShare = null;
                data.totalAgentShare = null;
                data.totalShopShare = null;
                break;
            case 'agent':
                data = await AgentCommission.findAll({
                    where: {
                        agentId: id,
                        createdAt: {
                            [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                        }
                    },
                    include: [
                        { model: Stock, attributes }
                    ],
                    order: [["createdAt", "DESC"]]
                });
                data.totalSalesShare = null;
                data.totalSubAgentShare = null;
                data.totalShopShare = null;
                break;
            case 'shop':
                data = await ShopCommission.findAll({
                    where: {
                        shopId: id,
                        createdAt: {
                            [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
                        }
                    },
                    include: [
                        { model: Stock, attributes }
                    ],
                    order: [["createdAt", "DESC"]]
                });
                data.totalSalesShare = null;
                data.totalSubAgentShare = null;
                data.totalAgentShare = null;
                break;
            default:
                break;
        }


        const jsonData = data.map(item => {
            const itemData = item.toJSON();

            switch (clientType) {
                case 'salesman':
                    itemData.Stock.totalSubAgentShare = null;
                    itemData.Stock.totalAgentShare = null;
                    itemData.Stock.totalShopShare = null;

                    break;
                case 'subAgent':
                    itemData.Stock.totalSalesShare = null;
                    itemData.Stock.totalAgentShare = null;
                    itemData.Stock.totalShopShare = null;
                    break;
                case 'agent':
                    itemData.Stock.totalSalesShare = null;
                    itemData.Stock.totalSubAgentShare = null;
                    itemData.Stock.totalShopShare = null;
                    break;
                case 'shop':
                    itemData.Stock.totalSalesShare = null;
                    itemData.Stock.totalSubAgentShare = null;
                    itemData.Stock.totalAgentShare = null;
                    break;
                default:
                    break;
            }
            return itemData;
        });

        res.json({ jsonData });
    } catch (error) {
        console.error("❌ Shop Detail Error:", error);
        res.status(500).json({ error: "Failed to fetch shop detail" });
    }
};

exports.getClientCommission = async (req, res) => {
    const { clientType, id, startDate, endDate } = req.query;

    try {
        const attributes = [
            'id',
            'amount',
            'totalSalesShare',
            'totalSubAgentShare',
            'totalAgentShare',
            'totalShopShare',
            'salesId',
            'subAgentId',
            'agentId',
            'shopId',
            'settledBy',
            'updatedAt',
        ];

        // --- 1. Build the WHERE clause ---
        const whereClause = {};
        let modelClause;

        switch (clientType) {
            case 'salesman':
                whereClause.salesId = id;
                modelClause = SalesmanCommission;
                break;
            case 'subAgent':
                whereClause.subAgentId = id;
                modelClause = SubAgentCommission;
                break;
            case 'agent':
                whereClause.agentId = id;
                modelClause = AgentCommission;
                break;
            case 'shop':
                whereClause.shopId = id;
                modelClause = ShopCommission;
                break;
            default:
                break;
        }
        // Add date range filtering if provided
        const dateFilter = {};
        if (startDate) {
            // Ensure startDate is a Date object if passed as string
            const start = startDate instanceof Date ? startDate : new Date(startDate);
            if (!isNaN(start)) { // Check if date parsing was successful
                dateFilter[Op.gte] = start; // Greater than or equal to startDate
            } else {
                console.warn("Invalid startDate provided:", startDate);
            }
        }
        if (endDate) {
            // Ensure endDate is a Date object
            const end = endDate instanceof Date ? endDate : new Date(endDate);
            if (!isNaN(end)) {
                // To make endDate inclusive for the whole day, set time to end of day
                end.setHours(23, 59, 59, 999);
                dateFilter[Op.lte] = end; // Less than or equal to endDate
            } else {
                console.warn("Invalid endDate provided:", endDate);
            }
        }

        // Add dateFilter to whereClause if it has any conditions
        if (Object.keys(dateFilter).length > 0) {
            whereClause.createdAt = dateFilter;
        }

        const stockBatches = await StockBatch.findAll({
            attributes: [
                'id',
                'itemCount',
                'status',
                'createdAt',
                'updatedAt'
            ],
            include: [{
                model: Stock,
                where: whereClause,
                required: true,
                attributes: attributes, // Select the attributes you want from Stock
                include: [
                    {
                        model: Shop,
                        attributes: [
                            'name',
                            'status'
                        ],
                        as: 'Shop' // Explicitly alias the association
                    },
                    {
                        model: Metric,
                        include: [
                            {
                                model: Product,
                                attributes: [
                                    'name',
                                    'status'
                                ],
                                as: 'Product' // Explicitly alias the association
                            }
                        ],
                        attributes: [
                            'metricType'
                        ],
                        as: 'Metric' // Explicitly alias the association
                    },
                ],
                order: [["createdAt", "DESC"]]
            }],
            distinct: true,
            order: [["createdAt", "DESC"]]
        });

        const flattenedData = stockBatches.map(stockBatch => {
            const batchData = stockBatch.get({ plain: true });
            let totalSalesShareSum = 0;
            let totalSubAgentShareSum = 0;
            let totalAgentShareSum = 0;
            let totalShopShareSum = 0;

            batchData.Stocks = batchData.Stocks.map(stock => {
                const flattenedStock = { ...stock };
                totalSalesShareSum += flattenedStock.totalSalesShare || 0;
                totalSubAgentShareSum += flattenedStock.totalSubAgentShare || 0;
                totalAgentShareSum += flattenedStock.totalAgentShare || 0;
                totalShopShareSum += flattenedStock.totalShopShare || 0;

                if (stock.Shop) {
                    flattenedStock.shopName = stock.Shop.name;
                    flattenedStock.shopStatus = stock.Shop.status;
                    delete flattenedStock.Shop;
                }
                if (stock.Metric) {
                    flattenedStock.metricType = stock.Metric.metricType;
                    if (stock.Metric.Product) {
                        flattenedStock.productName = stock.Metric.Product.name;
                        flattenedStock.productStatus = stock.Metric.Product.status;
                        delete flattenedStock.Metric.Product;
                    }
                    delete flattenedStock.Metric;
                }
                return flattenedStock;
            });

            batchData.totalSalesShareSum = totalSalesShareSum;
            batchData.totalSubAgentShareSum = totalSubAgentShareSum;
            batchData.totalAgentShareSum = totalAgentShareSum;
            batchData.totalShopShareSum = totalShopShareSum;

            return batchData;
        });

        res.json(flattenedData);

    } catch (error) {
        console.error("❌ Shop Detail Error:", error);
        res.status(500).json({ error: "Failed to fetch shop detail" });
    }
};



// // TODO INI CUMA CONTOH
// async function findSalesmanCommissions({
//     salesId,
//     startDate,
//     endDate,
//     includeStock = true,
//     includeStockBatch = true,
// }) {

//     if (!salesId) {
//         throw new Error('salesId parameter is required.');
//     }

//     // --- 1. Build the WHERE clause ---
//     const whereClause = {
//         salesId: salesId, // Always filter by salesId
//     };

//     // Add date range filtering if provided
//     const dateFilter = {};
//     if (startDate) {
//         // Ensure startDate is a Date object if passed as string
//         const start = startDate instanceof Date ? startDate : new Date(startDate);
//         if (!isNaN(start)) { // Check if date parsing was successful
//             dateFilter[Op.gte] = start; // Greater than or equal to startDate
//         } else {
//             console.warn("Invalid startDate provided:", startDate);
//         }
//     }
//     if (endDate) {
//         // Ensure endDate is a Date object
//         const end = endDate instanceof Date ? endDate : new Date(endDate);
//         if (!isNaN(end)) {
//             // To make endDate inclusive for the whole day, set time to end of day
//             end.setHours(23, 59, 59, 999);
//             dateFilter[Op.lte] = end; // Less than or equal to endDate
//         } else {
//             console.warn("Invalid endDate provided:", endDate);
//         }
//     }

//     // Add dateFilter to whereClause if it has any conditions
//     if (Object.keys(dateFilter).length > 0) {
//         whereClause.createdAt = dateFilter;
//     }

//     console.log("Executing findSalesmanCommissions with where clause:", JSON.stringify(whereClause));

//     // --- 2. Build the INCLUDE array ---
//     const includeArr = [];

//     if (includeStock) {
//         const stockInclude = {
//             model: db.Stock,
//             required: true, // Use INNER JOIN to ensure commission has a valid stock
//         };

//         // Nest StockBatch inclusion if requested
//         if (includeStockBatch) {
//             stockInclude.include = [{
//                 model: db.StockBatch,
//                 required: false // Use LEFT JOIN here - maybe a stock doesn't always have a batch? Adjust if needed.
//                 // If a Stock *must* have a StockBatch, set to true.
//             }];
//         }
//         includeArr.push(stockInclude);
//     }

//     // --- 3. Execute the Query ---
//     try {
//         const commissions = await db.SalesmanCommission.findAll({
//             where: whereClause,
//             include: includeArr,
//             // Optional: Add ordering
//             order: [['createdAt', 'DESC']]
//         });

//         console.log(`Found ${commissions.length} SalesmanCommission records.`);
//         // Each 'commission' object will have:
//         // - Its own fields (id, stockId, salesId, amount, createdAt, etc.)
//         // - A 'Stock' property (if includeStock=true) with the associated Stock object.
//         // - The 'Stock' object might have a 'StockBatch' property (if includeStockBatch=true).
//         return commissions;

//     } catch (error) {
//         console.error('Error finding SalesmanCommissions:', error);
//         throw error;
//     }
// }

// // --- How to Use It ---

// async function getCommissionReport() {
//     try {
//         const reportOptions = {
//             salesId: '...', // <= Provide the actual Salesman UUID here
//             startDate: new Date('2025-05-01T00:00:00.000Z'), // Start of May 1st, 2025 UTC
//             // endDate: new Date('2025-05-04T23:59:59.999Z'), // End of May 4th, 2025 UTC
//             // You can omit endDate if you want all commissions from startDate onwards
//             // You can omit startDate if you want all commissions up to endDate
//             includeStock: true,
//             includeStockBatch: true
//         };

//         // Use the current date as the end date if not specified
//         if (!reportOptions.endDate) {
//             reportOptions.endDate = new Date(); // Use current time as end date
//             // The function internally sets it to the end of the day
//         }


//         const commissionsData = await findSalesmanCommissions(reportOptions);

//         // Process the data (e.g., send in API response, generate report)
//         console.log(JSON.stringify(commissionsData, null, 2)); // Pretty print the result
//         return commissionsData;

//     } catch (error) {
//         // Handle errors appropriately
//         console.error("Failed to get commission report:", error);
//     }
// }