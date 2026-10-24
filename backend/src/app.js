import cors from "cors";
import express from "express";
import luckyDrawRoutes from "./routes/luckyDrawRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", luckyDrawRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use(errorMiddleware);


export default app;
