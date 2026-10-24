import express from "express";
import {
  createEnquiry,
  listEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiryController.js";

const router = express.Router();

router.get("/", listEnquiries);
router.patch("/:enquiryId/status", updateEnquiryStatus);
router.post("/", createEnquiry);

export default router;