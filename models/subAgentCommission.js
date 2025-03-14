module.exports = (sequelize, DataTypes) => {
    const SubAgentCommission = sequelize.define("SubAgentCommission", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        stockId: { type: DataTypes.UUID, allowNull: false },
        subAgentId: { type: DataTypes.UUID, allowNull: false },
        percentage: { type: DataTypes.FLOAT, allowNull: false },
        totalNetPrice: { type: DataTypes.FLOAT, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        createdBy: { type: DataTypes.STRING, allowNull: false }
    }, { timestamps: true });

    SubAgentCommission.associate = (models) => {
        SubAgentCommission.belongsTo(models.Stock, { foreignKey: "stockId" });
        SubAgentCommission.belongsTo(models.SubAgent, { foreignKey: "subAgentId" });
    };

    return SubAgentCommission;
};
