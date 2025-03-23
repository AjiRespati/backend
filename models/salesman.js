module.exports = (sequelize, DataTypes) => {
    const Salesman = sequelize.define("Salesman", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true  },
        image: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING, unique: true },
        email: { type: DataTypes.STRING, unique: true },
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    Salesman.associate = (models) => {
        Salesman.hasMany(models.BankAccount, { foreignKey: "salesId", onDelete: "CASCADE" });
    };

    return Salesman;
};
