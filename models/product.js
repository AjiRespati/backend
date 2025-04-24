
module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define("Product", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        image: { type: DataTypes.STRING },
        description: { type: DataTypes.TEXT },
        updateBy: { type: DataTypes.STRING },
        status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    }, { timestamps: true });

    Product.associate = (models) => {
        Product.hasMany(models.Metric, { foreignKey: "productId", onDelete: "CASCADE" });
    };

    return Product;
};

