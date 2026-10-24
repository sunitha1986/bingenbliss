import { isAdminToken } from "../config/adminAuth.js";
import {
  createEnquiry as saveEnquiry,
  listEnquiries as readEnquiries,
  updateEnquiryStatus as saveEnquiryStatus,
} from "../models/enquiryModel.js";

const enquiryStatuses = new Set(["New", "Contacted", "Converted", "Closed"]);

export async function listEnquiries(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!isAdminToken(token)) {
    return res.status(401).json({ message: "Admin access is required" });
  }

  try {
    const enquiries = await readEnquiries();
    return res.json({ enquiries });
  } catch (error) {
    return next(error);
  }
}

export async function updateEnquiryStatus(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!isAdminToken(token)) {
    return res.status(401).json({ message: "Admin access is required" });
  }

  const { enquiryId } = req.params;
  const { status } = req.body || {};
  if (!/^[1-9][0-9]*$/.test(enquiryId) || !enquiryStatuses.has(status)) {
    return res.status(400).json({ message: "Enter a valid enquiry status" });
  }

  try {
    const updated = await saveEnquiryStatus(enquiryId, status);
    if (!updated) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    return res.json({ enquiryId, status });
  } catch (error) {
    return next(error);
  }
}

export async function createEnquiry(req, res) {
  try {
    const {
      name,
      phone,
      eventType,
      eventDate,
      guests,
      requirements,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof eventType !== "string" ||
      !eventType.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone number, and event type are required.",
      });
    }

    const enquiry = await saveEnquiry({
      name: name.trim(),
      phone: phone.trim(),
      eventType: eventType.trim(),
      eventDate: typeof eventDate === "string" ? eventDate : "",
      guests: typeof guests === "string" ? guests : "",
      requirements:
        typeof requirements === "string"
          ? requirements.trim()
          : "",
    });
    
        return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      enquiryId: String(enquiry.id),
      
    });

  } catch (error) {
    console.error("Create enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry. Please try again.",
    });
  }
}