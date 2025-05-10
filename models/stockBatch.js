module.exports = (sequelize, DataTypes) => {
    const StockBatch = sequelize.define("StockBatch", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        batchType: { // e.g., 'stock_creation', 'settlement'
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: { // Tracks the status of the batch processing itself
            type: DataTypes.ENUM('processing', 'completed', 'failed', 'settled', 'canceled'),
            allowNull: false,
            defaultValue: 'processing',
        },
        itemCount: { // Expected number of items
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        successCount: { // Actual successful items (relevant for non-atomic or settlement)
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        failureCount: { // Actual failed items (relevant for non-atomic or settlement)
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        createdBy: { // User who initiated the batch
            type: DataTypes.STRING,
            allowNull: false,
        },
        creatorId: { // User who initiated the batch
            type: DataTypes.STRING,
            allowNull: false,
        },
        parentType: { // User who initiated the batch
            type: DataTypes.STRING,
            allowNull: true,
        },
        parentId: { // User who initiated the batch
            type: DataTypes.STRING,
            allowNull: true,
        },
        parentEmail: { // User who initiated the batch
            type: DataTypes.STRING,
            allowNull: true,
        },
        // --- Optional: Add canceledBy field ---
        canceledBy: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userDesc: { // User who initiated the batch
            type: DataTypes.STRING,
            allowNull: false,
        },
        errorMessage: { // Store details if the batch failed
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Add other potential batch-level info if needed, e.g., target shop
        // shopId: {
        //   type: DataTypes.UUID,
        //   allowNull: true
        // }
    }, { timestamps: true });

    StockBatch.associate = (models) => {
        StockBatch.hasMany(models.Stock, {
            foreignKey: 'stockBatchId',
            //   as: 'stockEntries' // Alias to access associated stocks
        });
    };

    return StockBatch;
};
