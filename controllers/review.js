const Review = require("../models/Review");
const Coworking = require("../models/Coworking");
exports.getReviews = async (req, res, next) => {
    try {
        // Pagination setup
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Get total number of reviews
        const total = await Review.countDocuments();

        // Fetch reviews with pagination
        const reviews = await Review.find()
            .populate("user", "name") // Populate user name
            .populate("coworking", "name address") // Populate coworking space details
            .skip(startIndex)
            .limit(limit);

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: reviews.length,
            pagination,
            data: reviews
        });
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({ success: false, message: "Error fetching reviews" });
    }
};

// @desc Add a review
// @route POST /api/v1/coworkings/:coworkingId/reviews
// @access Private
exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const coworkingId = req.params.coworkingId;

        const coworking = await Coworking.findById(coworkingId);
        if (!coworking) {
            return res.status(404).json({ message: "Coworking space not found" });
        }

        const review = await Review.create({
            rating,
            comment,
            user: req.user.id,
            coworking: coworkingId
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ message: "Error adding review", error: error.message });
    }
};

// @desc Get all reviews for a coworking space
// @route GET /api/v1/coworkings/:coworkingId/reviews
// @access Public
exports.getReview = async (req, res) => {
    try {
        const reviews = await Review.find({ coworking: req.params.coworkingId }).populate("user", "name");
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
};

// @desc Update a review
// @route PUT /api/v1/reviews/:id
// @access Private
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidator: true
        });
        if (!review) {
            return res.status(400).json({ success: false });
        }
        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

// @desc Delete a review
// @route DELETE /api/v1/reviews/:id
// @access Private/Admin
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized to delete this review" });
        }

        await Review.deleteOne({ _id: req.params.id })
        res.status(200).json({ success: true, message: "Review deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting review", error: error.message });
    }
};

