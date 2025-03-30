module.exports = (sequelize, DataTypes) => {
    const ShopAllCommission = sequelize.define("ShopAllCommission", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        stockId: { type: DataTypes.UUID, allowNull: false },
        salesId: { type: DataTypes.UUID, allowNull: true },
        subAgentId: { type: DataTypes.UUID, allowNull: true },
        agentId: { type: DataTypes.UUID, allowNull: true },
        percentage: { type: DataTypes.FLOAT, allowNull: false },
        totalNetPrice: { type: DataTypes.FLOAT, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        createdBy: { type: DataTypes.STRING, allowNull: false }
    }, { timestamps: true });

    ShopAllCommission.associate = (models) => {
        ShopAllCommission.belongsTo(models.Stock, { foreignKey: "stockId" });
        ShopAllCommission.belongsTo(models.Salesman, { foreignKey: "salesId" });
        ShopAllCommission.belongsTo(models.SubAgent, { foreignKey: "subAgentId" });
        ShopAllCommission.belongsTo(models.Agent, { foreignKey: "agentId" });
    };

    return ShopAllCommission;
};
