module.exports = (sequelize, DataTypes) => {
    const AgentCommission = sequelize.define("AgentCommission", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        stockId: { type: DataTypes.UUID, allowNull: false },
        agentId: { type: DataTypes.UUID, allowNull: false },
        percentage: { type: DataTypes.FLOAT, allowNull: false },
        totalNetPrice: { type: DataTypes.FLOAT, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        createdBy: { type: DataTypes.STRING, allowNull: false }
    }, { timestamps: true });

    AgentCommission.associate = (models) => {
        AgentCommission.belongsTo(models.Stock, { foreignKey: "stockId" });
        AgentCommission.belongsTo(models.Agent, { foreignKey: "agentId" });
    };

    return AgentCommission;
};
