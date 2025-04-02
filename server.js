require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./config/logger");
const { sequelize } = require("./models");

const app = express();

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
const subagentRoutes = require("./routes/subagentRoutes");
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

// ✅ Serve Static Files (Fix the Image Error)
app.use('/api/uploads', express.static('uploads'));

// ✅ Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/metrics", metricRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/salesmen", salesmanRoutes);
app.use("/api/subagents", subagentRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/bankAccount", bankAccountRoutes);
app.use("/api/percentages", percentageRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/refrigerators", refrigeratorRoutes);
app.use("/api/agentCommissions", agentCommissionRoutes);
app.use("/api/subAgentCommissions", subAgentCommissionRoutes);
app.use("/api/salesmanCommissions", salesmanCommissionRoutes);
app.use("/api/distributorCommissions", distributorCommissionRoutes);
app.use("/api/shopCommissions", shopCommissionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ✅ Sync Database & Start Server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
    .then(() => {
        logger.info("✅ Database synchronized successfully.");
        app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.log(err);
        logger.error("❌ Database sync error:", err.stack);
    });
