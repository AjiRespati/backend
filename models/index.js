// models/index.js - Modified to use environment variables directly

'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development'; // Keep env if needed for logging/options
// const config = require(__dirname + '/../config/config.json')[env]; // REMOVED config.json dependency
const db = {};

// --- Initialize Sequelize directly using environment variables ---
const sequelize = new Sequelize(
    process.env.DB_NAME,      // Database name from env var
    process.env.DB_USER,      // Database user from env var
    process.env.DB_PASS,  // Database password from env var
    {
        host: process.env.DB_HOST,      // Database host from env var
        port: process.env.DB_PORT || 5432, // Database port from env var (defaults to 5432)
        dialect: 'postgres',             // Explicitly set dialect
        
        // Optional: Configure logging based on environment
        // Set NODE_ENV=development in .env to see SQL logs when running from SSH
        logging: process.env.NODE_ENV === 'development' ? console.log : false, 

        // Add any other Sequelize options you might need here
        // dialectOptions: {
        //   ssl: {
        //     require: true,
        //     rejectUnauthorized: false // Adjust based on your SSL requirements
        //   }
        // }
    }
);
// --- End of Sequelize initialization ---

// --- Load models ---
fs
    .readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
        );
    })
    .forEach(file => {
        // Ensure models are defined correctly, passing sequelize instance
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });
// --- End of loading models ---

// --- Setup associations ---
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
// --- End of associations ---

db.sequelize = sequelize; // The configured Sequelize instance
db.Sequelize = Sequelize; // The Sequelize library itself

module.exports = db;