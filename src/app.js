const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandlers");
const { monitoringMiddleware } = require("./services/systemMonitor");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-exact-vercel-url.vercel.app", // 🚨 Put your REAL Vercel URL here
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(monitoringMiddleware);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/translate", require("./routes/translateRoutes"));

// Error Handler
app.use(errorHandler);

module.exports = app;
