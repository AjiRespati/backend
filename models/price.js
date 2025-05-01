
module.exports = (sequelize, DataTypes) => {
    const Price = sequelize.define("Price", {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        metricId: { type: DataTypes.UUID, allowNull: false },

        // factory price, distributor paid to factory
        price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0  },

        // equal to shopPrice, salesman paid to distributor(without profit cut). profit will be given monthly
        salesmanPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0  },

        // equal to shopPrice, subagent paid to distributor(without profit cut). profit will be given monthly
        subAgentPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0  },

        // agent paid to distributor with profit cut.
        agentPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0  },

        // shop paid to all gracia clients
        shopPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },

        // consumer paid to shop.
        // input from UI
        netPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0  },

        updateBy: { type: DataTypes.STRING },
        status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    }, { timestamps: true });

    Price.associate = (models) => {
        Price.belongsTo(models.Metric, { foreignKey: "metricId" });
    };

    return Price;
};

