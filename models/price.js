
module.exports = (sequelize, DataTypes) => {
    const Price = sequelize.define("Price", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        metricId: { type: DataTypes.UUID, allowNull: false },
        price: { type: DataTypes.FLOAT, allowNull: false },
        salesmanPrice: { type: DataTypes.FLOAT, allowNull: false },
        subAgentPrice: { type: DataTypes.FLOAT, allowNull: false },
        agentPrice: { type: DataTypes.FLOAT, allowNull: false },
        netPrice: { type: DataTypes.FLOAT, allowNull: false },
        updateBy: { type: DataTypes.STRING },
        status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    }, { timestamps: true });

    Price.associate = (models) => {
        Price.belongsTo(models.Metric, { foreignKey: "metricId" });
    };

    return Price;
};

