module.exports = (sequelize, DataTypes) => {
    const BankAccount = sequelize.define("BankAccount", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        salesId: { type: DataTypes.UUID, allowNull: true },
        subAgentId: { type: DataTypes.UUID, allowNull: true },
        agentId: { type: DataTypes.UUID, allowNull: true },
        accountNumber: { type: DataTypes.STRING, allowNull: false },
        accountName: { type: DataTypes.STRING, allowNull: false },
        bankName: { type: DataTypes.STRING, allowNull: false },
        bankCode: { type: DataTypes.STRING, allowNull: true }
    }, { timestamps: true });

    BankAccount.associate = (models) => {
        BankAccount.belongsTo(models.Salesman, { foreignKey: "salesId" });
        BankAccount.belongsTo(models.SubAgent, { foreignKey: "subAgentId" });
        BankAccount.belongsTo(models.Agent, { foreignKey: "agentId" });
    };

    return BankAccount;
};
