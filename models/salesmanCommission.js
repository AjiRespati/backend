module.exports = (sequelize, DataTypes) => {
    const SalesmanCommission = sequelize.define("SalesmanCommission", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        stockId: { type: DataTypes.UUID, allowNull: false },
        salesId: { type: DataTypes.UUID, allowNull: false },
        percentage: { type: DataTypes.FLOAT, allowNull: false },
        totalNetPrice: { type: DataTypes.FLOAT, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        createdBy: { type: DataTypes.STRING, allowNull: false }
    }, { timestamps: true });

    SalesmanCommission.associate = (models) => {
        SalesmanCommission.belongsTo(models.Stock, { foreignKey: "stockId" });
        SalesmanCommission.belongsTo(models.Salesman, { foreignKey: "salesId" });
    };

    return SalesmanCommission;
};
