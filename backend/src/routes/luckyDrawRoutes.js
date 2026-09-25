import { Router } from "express";
import {
  createOrder,
  health,
  login,
  validateCoupon,
} from "../controllers/luckyDrawController.js";

const router = Router();

router.get("/health", health);
router.post("/auth/login", login);
router.post("/coupons/validate", validateCoupon);
router.post("/orders", createOrder);

export default router;
