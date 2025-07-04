module.exports = (sequelize, DataTypes) => {
    const Salesman = sequelize.define("Salesman", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, },
        image: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING, unique: false },
        email: { type: DataTypes.STRING, unique: false },
        status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    Salesman.associate = (models) => {
        Salesman.hasMany(models.BankAccount, { foreignKey: "salesId", onDelete: "CASCADE" });
        Salesman.hasMany(models.Shop, { foreignKey: "salesId", onDelete: "CASCADE" });
    };

    return Salesman;
}
