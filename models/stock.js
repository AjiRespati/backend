module.exports = (sequelize, DataTypes) => {
    const Stock = sequelize.define("Stock", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        metricId: { type: DataTypes.UUID, allowNull: false },
        stockEvent: { type: DataTypes.ENUM("stock_in", "stock_out"), allowNull: false },
        initialAmount: { type: DataTypes.FLOAT, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        updateAmount: { type: DataTypes.FLOAT, allowNull: false },
        totalPrice: { type: DataTypes.FLOAT, allowNull: false },
        totalNetPrice: { type: DataTypes.FLOAT, allowNull: false },
        totalDistributorShare: { type: DataTypes.FLOAT, allowNull: false },
        totalSalesShare: { type: DataTypes.FLOAT, allowNull: true },
        totalSubAgentShare: { type: DataTypes.FLOAT, allowNull: true },
        totalAgentShare: { type: DataTypes.FLOAT, allowNull: true },
        totalShopShare: { type: DataTypes.FLOAT, allowNull: true },
        createdBy: { type: DataTypes.STRING, allowNull: false },
        canceledBy: { type: DataTypes.STRING, allowNull: true },
        removedBy: { type: DataTypes.STRING, allowNull: true },
        settledBy: { type: DataTypes.STRING, allowNull: true },
        salesId: { type: DataTypes.UUID, allowNull: true },
        subAgentId: { type: DataTypes.UUID, allowNull: true },
        agentId: { type: DataTypes.UUID, allowNull: true },
        shopId: { type: DataTypes.UUID, allowNull: true },
        status: { type: DataTypes.ENUM("created", "canceled", "removed", "settled"), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true }
    }, { timestamps: true });

    Stock.associate = (models) => {
        Stock.belongsTo(models.Metric, { foreignKey: "metricId" });
        Stock.belongsTo(models.Salesman, { foreignKey: "salesId" });
        Stock.belongsTo(models.SubAgent, { foreignKey: "subAgentId" });
        Stock.belongsTo(models.Agent, { foreignKey: "agentId" });
        Stock.belongsTo(models.Shop, { foreignKey: "shopId" });
    };

    return Stock;
};
