module.exports = (sequelize, DataTypes) => {
    const DistributorCommission = sequelize.define("DistributorCommission", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        stockId: { type: DataTypes.UUID, allowNull: false },
        percentage: { type: DataTypes.FLOAT, allowNull: false },
        totalNetPrice: { type: DataTypes.FLOAT, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        createdBy: { type: DataTypes.STRING, allowNull: false }
    }, { timestamps: true });

    DistributorCommission.associate = (models) => {
        DistributorCommission.belongsTo(models.Stock, { foreignKey: "stockId" });
    };

    return DistributorCommission;
};
