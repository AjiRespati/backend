module.exports = (sequelize, DataTypes) => {
    const Agent = sequelize.define("Agent", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: false  },
        image: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING, unique: false },
        email: { type: DataTypes.STRING, unique: false },
        status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        updateBy: { type: DataTypes.STRING }
    }, { timestamps: true });

    Agent.associate = (models) => {
        Agent.hasMany(models.BankAccount, { foreignKey: "agentId", onDelete: "CASCADE" });
        Agent.hasMany(models.Shop, { foreignKey: "agentId", onDelete: "CASCADE" });
    };

    return Agent;
}
