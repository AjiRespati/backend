module.exports = (sequelize, DataTypes) => {
    const ShopCommission = sequelize.define("ShopCommission", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        stockId: { type: DataTypes.UUID, allowNull: false },
        shopId: { type: DataTypes.UUID, allowNull: false },
        percentage: { type: DataTypes.FLOAT, allowNull: false },
        totalNetPrice: { type: DataTypes.FLOAT, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        createdBy: { type: DataTypes.STRING, allowNull: false }
    }, { timestamps: true });

    ShopCommission.associate = (models) => {
        ShopCommission.belongsTo(models.Stock, { foreignKey: "stockId" });
        ShopCommission.belongsTo(models.Shop, { foreignKey: "shopId" });
    };

    return ShopCommission;
};
