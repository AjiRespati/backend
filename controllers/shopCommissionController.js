const { Stock, Percentage, ShopCommission, Metric, Product } = require("../models");
const logger = require("../config/logger");

exports.settleShopCommission = async (req, res) => {
    try {
        const { stockId, shopId, createdBy } = req.body;

        // ✅ Get Stock
        const stock = await Stock.findByPk(stockId);
        if (!stock) return res.status(404).json({ error: "Stock not found" });

        // ✅ Get Shop Percentage from Percentages Table
        const shopPercentage = await Percentage.findOne({ where: { key: "shop" } });
        if (!shopPercentage) return res.status(500).json({ error: "Percentage for shop not set" });

        // ✅ Calculate Shop Share
        const totalNetPrice = stock.totalNetPrice;
        const commissionAmount = (totalNetPrice * shopPercentage.value) / 100;

        // ✅ Store Commission in SHOPCOMMISSIONS Table
        const commission = await ShopCommission.create({
            stockId,
            shopId,
            percentage: shopPercentage.value,
            totalNetPrice,
            amount: commissionAmount,
            createdBy
        });

        logger.info(`✅ Shop Commission Settled for Stock: ${stockId}`);
        res.status(201).json(commission);
    } catch (error) {
        logger.error(`❌ Shop Commission Settlement Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to settle shop commission" });
    }
};

exports.getShopCommissionReport = async (req, res) => {
    const { shopId, startDate, endDate, productId, stockEvent } = req.query;

    try {
        const whereClause = {
            shopId,
            createdAt: {
                [Op.between]: [startDate || "1970-01-01", endDate || new Date()]
            }
        };

        if (stockEvent) whereClause["$Stock.stockEvent$"] = stockEvent;
        if (productId) whereClause["$Stock.Metric.productId$"] = productId;

        const commissions = await ShopCommission.findAll({
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
        logger.error(`❌ Fetching Shop Commission Report Error: ${error.stack}`);
        res.status(500).json({ error: "Failed to fetch report" });
    }
};
