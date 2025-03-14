module.exports = (sequelize, DataTypes) => {
    const Refrigerator = sequelize.define("Refrigerator", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        capacity: { type: DataTypes.FLOAT, allowNull: false },
        serialNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
        coordinates: { type: DataTypes.STRING, allowNull: true }, // Store coordinates as a string "latitude,longitude"
        shopId: { type: DataTypes.UUID, allowNull: true },
        status: { type: DataTypes.ENUM("idle", "active", "broken", "wasted"), allowNull: false, defaultValue: "idle" },
        deliveryDate: { type: DataTypes.DATE, allowNull: true },
        deliveryBy: { type: DataTypes.STRING, allowNull: true },
        retrieveDate: { type: DataTypes.DATE, allowNull: true },
        retrieveBy: { type: DataTypes.STRING, allowNull: true },
        repairedDate: { type: DataTypes.DATE, allowNull: true },
        repairedBy: { type: DataTypes.STRING, allowNull: true }
    }, { timestamps: true });

    Refrigerator.associate = (models) => {
        Refrigerator.belongsTo(models.Shop, { foreignKey: "shopId" });
    };

    return Refrigerator;
};
