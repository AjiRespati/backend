module.exports = (sequelize, DataTypes) => {
    const Shop = sequelize.define("Shop", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        salesId: { type: DataTypes.UUID, allowNull: true },
        subAgentId: { type: DataTypes.UUID, allowNull: true },
        agentId: { type: DataTypes.UUID, allowNull: true },
        name: { type: DataTypes.STRING, allowNull: false },
        image: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING, allowNull: false },
        coordinates: { type: DataTypes.STRING, allowNull: true }, // Store coordinates as a string "latitude,longitude"
        phone: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: true, unique: false },
        status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    Shop.associate = (models) => {
        Shop.hasMany(models.Refrigerator, { foreignKey: "shopId", onDelete: "SET NULL" });
        Shop.belongsTo(models.Salesman, { foreignKey: "salesId" });
        Shop.belongsTo(models.SubAgent, { foreignKey: "subAgentId" });
        Shop.belongsTo(models.Agent, { foreignKey: "agentId" });
    };

    return Shop;
}
