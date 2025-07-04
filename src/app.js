import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config({
  path: "./.env",
});

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4004",
    credentials: true,
  })
);

// middlewares
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));
// Serve static files from the 'public' directory like images
app.use(express.static("public"));
app.use(cookieParser())

// importing the routers
import healthCheckRouter  from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
// routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/user",userRouter);

export default app;
