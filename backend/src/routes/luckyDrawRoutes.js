import { Router } from "express";
import { googlePlaceReviews } from "../controllers/googleReviewsController.js";
import {
  createLuckyDrawEntry,
  createOrder,
  deleteLuckyDrawCustomer,
  adminLogin,
  health,
  login,
  listLuckyDrawCustomers,
  listLuckyDrawWinners,
  lookupCustomerRegistration,
  luckyDrawLatestWinner,
  luckyDrawStatus,
  setLuckyDrawVisibility,
  setLuckyDrawIncludeAllEntriesNextDraw,
  setLuckyDrawIncludeAllThisMonthEntriesNextDraw,
  spinLuckyDraw,
  updateLuckyDrawFeatures,
  updateLuckyDrawOccasions,
  updateLuckyDrawNextDrawDate,
  updateLuckyDrawCustomer,
  validateCoupon,
  verifyCustomerLogin,
} from "../controllers/luckyDrawController.js";

const router = Router();

router.get("/health", health);
router.get("/google-reviews", googlePlaceReviews);
router.post("/lucky-draw", createLuckyDrawEntry);
router.get("/lucky-draw/latest-winner", luckyDrawLatestWinner);
router.get("/lucky-draw/status", luckyDrawStatus);
router.post("/admin/login", adminLogin);
router.get("/admin/lucky-draw/winners", listLuckyDrawWinners);
router.post("/admin/lucky-draw/spin", spinLuckyDraw);
router.post("/admin/lucky-draw/visibility", setLuckyDrawVisibility);
router.post(
  "/admin/lucky-draw/eligibility-reset",
  setLuckyDrawIncludeAllEntriesNextDraw,
);
router.post(
  "/admin/lucky-draw/include-this-month-entries",
  setLuckyDrawIncludeAllThisMonthEntriesNextDraw,
);
router.patch("/admin/lucky-draw/features", updateLuckyDrawFeatures);
router.put("/admin/lucky-draw/features", updateLuckyDrawFeatures);
router.post("/admin/lucky-draw/features", updateLuckyDrawFeatures);
router.patch("/admin/lucky-draw/occasions", updateLuckyDrawOccasions);
router.put("/admin/lucky-draw/occasions", updateLuckyDrawOccasions);
router.post("/admin/lucky-draw/occasions", updateLuckyDrawOccasions);
router.patch("/admin/lucky-draw/next-draw-date", updateLuckyDrawNextDrawDate);
router.put("/admin/lucky-draw/next-draw-date", updateLuckyDrawNextDrawDate);
router.post("/admin/lucky-draw/next-draw-date", updateLuckyDrawNextDrawDate);
router.get("/admin/customers", listLuckyDrawCustomers);
router.put("/admin/customers/:customerId", updateLuckyDrawCustomer);
router.delete("/admin/customers/:customerId", deleteLuckyDrawCustomer);
router.post("/auth/customer-lookup", lookupCustomerRegistration);
router.post("/auth/customer-verify", verifyCustomerLogin);
router.post("/auth/login", login);
router.post("/coupons/validate", validateCoupon);
router.post("/orders", createOrder);

export default router;
