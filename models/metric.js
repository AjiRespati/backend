
module.exports = (sequelize, DataTypes) => {
    const Metric = sequelize.define("Metric", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false },
        metricType: {
            type: DataTypes.ENUM("kg", "g", "liter", "bucket", "carton", "box", "pcs"),
            allowNull: false
        },
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    Metric.associate = (models) => {
        Metric.belongsTo(models.Product, { foreignKey: "productId" });
        Metric.hasMany(models.Price, { foreignKey: "metricId", onDelete: "CASCADE" });
        Metric.hasMany(models.Stock, { foreignKey: "metricId", onDelete: "CASCADE" }); // ✅ Add this line
    };

    return Metric;
};

