
import express from "express";
import Feedback from "../models/feedback.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {name, email, subject, message} = req.body;

    const fields = { name, email, subject, message };

    for (const [field, value] of Object.entries(fields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `${field} is required and must be a non-empty string`
        });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    const feedback = await Feedback.create({name, email: normalizedEmail, subject, message});

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback data"
      });
    }

    console.error("Error submitting feedback:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to submit feedback"
    });
  }
});

export default router;
