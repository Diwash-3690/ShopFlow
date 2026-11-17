require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const shopRoutes = require("./routes/shopRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const customerRoutes = require("./routes/customerRoutes");
const billRoutes = require("./routes/billRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const archiveRoutes = require("./routes/archiveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/archived-bills", archiveRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to ShopFlow Backend");
});

app.use((err, req, res, next) => {
    return res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log("PostgreSQL Connected Successfully");

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to database:", error.message);
        process.exit(1);
    }
};

startServer();
