module.exports = (sequelize, DataTypes) => {
    const Shop = sequelize.define("Shop", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        image: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING },
        coordinates: { type: DataTypes.STRING, allowNull: true }, // Store coordinates as a string "latitude,longitude"
        phone: { type: DataTypes.STRING, unique: true },
        email: { type: DataTypes.STRING, unique: true },
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    Shop.associate = (models) => {
        Shop.hasMany(models.Refrigerator, { foreignKey: "shopId", onDelete: "SET NULL" });
    };

    return Shop;
};
