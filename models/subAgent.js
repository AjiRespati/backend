module.exports = (sequelize, DataTypes) => {
    const SubAgent = sequelize.define("SubAgent", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true  },
        image: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING, unique: true },
        email: { type: DataTypes.STRING, unique: true },
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    SubAgent.associate = (models) => {
        SubAgent.hasMany(models.BankAccount, { foreignKey: "subAgentId", onDelete: "CASCADE" });
    };

    return SubAgent;
};
