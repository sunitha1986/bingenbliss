import cors from "cors";
import express from "express";
import luckyDrawRoutes from "./routes/luckyDrawRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api", luckyDrawRoutes);
app.use(errorMiddleware);

export default app;
