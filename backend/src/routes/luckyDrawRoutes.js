import { Router } from "express";
import {
  createLuckyDrawEntry,
  createOrder,
  deleteLuckyDrawCustomer,
  adminLogin,
  health,
  login,
  listLuckyDrawCustomers,
  listLuckyDrawWinners,
  luckyDrawStatus,
  setLuckyDrawVisibility,
  spinLuckyDraw,
  updateLuckyDrawFeatures,
  updateLuckyDrawCustomer,
  validateCoupon,
} from "../controllers/luckyDrawController.js";

const router = Router();

router.get("/health", health);
router.post("/lucky-draw", createLuckyDrawEntry);
router.get("/lucky-draw/status", luckyDrawStatus);
router.post("/admin/login", adminLogin);
router.get("/admin/lucky-draw/winners", listLuckyDrawWinners);
router.post("/admin/lucky-draw/spin", spinLuckyDraw);
router.post("/admin/lucky-draw/visibility", setLuckyDrawVisibility);
router.patch("/admin/lucky-draw/features", updateLuckyDrawFeatures);
router.get("/admin/customers", listLuckyDrawCustomers);
router.put("/admin/customers/:customerId", updateLuckyDrawCustomer);
router.delete("/admin/customers/:customerId", deleteLuckyDrawCustomer);
router.post("/auth/login", login);
router.post("/coupons/validate", validateCoupon);
router.post("/orders", createOrder);

export default router;
