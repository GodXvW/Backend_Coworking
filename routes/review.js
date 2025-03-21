const express = require("express");
const { addReview, getReviews, updateReview, deleteReview, getReview } = require("../controllers/review");
const { protect, authorize } = require("../middleware/auth"); // Ensure correct middleware import

const router = express.Router();

// Public Routes
router.post("/:coworkingId/reviews", protect, addReview); // Users can add a review
router.get("/", protect, authorize('admin'), getReviews); // Admins can get all reviews

// Admin-Only Routes
router.get("/:coworkingId/reviews", protect, authorize('admin'), getReview);
router.put("/:id", protect, authorize('admin'), updateReview);
router.delete("/:id", protect, authorize('admin'), deleteReview);

module.exports = router;
