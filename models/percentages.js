module.exports = (sequelize, DataTypes) => {
    const Percentage = sequelize.define("Percentage", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        key: { 
            type: DataTypes.ENUM("supplier", "distributor", "shop", "salesman", "subAgent", "agent"),
            allowNull: false
        },
        value: { type: DataTypes.FLOAT, allowNull: true }, // Distributor starts as NULL
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    return Percentage;
};
