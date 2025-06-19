require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./config/logger");
const { sequelize } = require("./models");

const app = express();

//TODO: Versioning
const version = "1.1.2+7";

// ✅ Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const metricRoutes = require("./routes/metricRoutes");
const priceRoutes = require("./routes/priceRoutes");
const salesmanRoutes = require("./routes/salesmanRoutes");
const subagentRoutes = require("./routes/subAgentRoutes");
const agentRoutes = require("./routes/agentRoutes");
const bankAccountRoutes = require("./routes/bankAccountRoutes");
const percentageRoutes = require("./routes/percentageRoute");
const stockRoutes = require("./routes/stockRoutes");
const shopRoutes = require("./routes/shopRoutes");
const refrigeratorRoutes = require("./routes/refrigeratorRoutes");
const agentCommissionRoutes = require("./routes/agentCommissionRoutes");
const subAgentCommissionRoutes = require("./routes/subAgentCommissionRoutes");
const salesmanCommissionRoutes = require("./routes/salesmanCommissionRoutes");
const distributorCommissionRoutes = require("./routes/distributorCommissionRoutes");
const shopCommissionRoutes = require("./routes/shopCommissionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const base = "/service";

app.get(`${base}/`, (req, res) => {
    res.status(200).json({ message: `✅ Gracia ${version} Service API is running!` });
});

// ✅ Serve Static Files (Fix the Image Error)
app.use(`${base}/api/uploads`, express.static('uploads'));

// ✅ Register Routes
app.use(`${base}/api/auth`, authRoutes);
app.use(`${base}/api/users`, userRoutes);
app.use(`${base}/api/products`, productRoutes);
app.use(`${base}/api/metrics`, metricRoutes);
app.use(`${base}/api/prices`, priceRoutes);
app.use(`${base}/api/salesmen`, salesmanRoutes);
app.use(`${base}/api/subagents`, subagentRoutes);
app.use(`${base}/api/agents`, agentRoutes);
app.use(`${base}/api/bankAccount`, bankAccountRoutes);
app.use(`${base}/api/percentages`, percentageRoutes);
app.use(`${base}/api/stocks`, stockRoutes);
app.use(`${base}/api/shops`, shopRoutes);
app.use(`${base}/api/refrigerators`, refrigeratorRoutes);
app.use(`${base}/api/agentCommissions`, agentCommissionRoutes);
app.use(`${base}/api/subAgentCommissions`, subAgentCommissionRoutes);
app.use(`${base}/api/salesmanCommissions`, salesmanCommissionRoutes);
app.use(`${base}/api/distributorCommissions`, distributorCommissionRoutes);
app.use(`${base}/api/shopCommissions`, shopCommissionRoutes);
app.use(`${base}/api/dashboard`, dashboardRoutes);

// ✅ Sync Database & Start Server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
    .then(() => {
        logger.info("✅ Database synchronized successfully.");
        app.listen(PORT, () => logger.info(`🚀 Server ${version} running on port ${PORT}`));
    })
    .catch((err) => {
        logger.error(`❌ Database sync error: ${err.stack}`);
        logger.error(err);
    });
