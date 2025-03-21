const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    coworking: {
        type: mongoose.Schema.ObjectId,
        ref: "Coworking",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate average rating for the coworking space
ReviewSchema.statics.calculateAverageRating = async function (coworkingId) {
    const result = await this.aggregate([
        { $match: { coworking: coworkingId } },
        { $group: { _id: "$coworking", averageRating: { $avg: "$rating" } } }
    ]);

    if (result.length > 0) {
        await mongoose.model("Coworking").findByIdAndUpdate(coworkingId, {
            averageRating: result[0].averageRating.toFixed(1)
        });
    } else {
        await mongoose.model("Coworking").findByIdAndUpdate(coworkingId, {
            averageRating: 0
        });
    }
};

// Update rating after saving/deleting reviews
ReviewSchema.post("save", async function () {
    await this.constructor.calculateAverageRating(this.coworking);
});

ReviewSchema.post("remove", async function () {
    await this.constructor.calculateAverageRating(this.coworking);
});

module.exports = mongoose.model("Review", ReviewSchema);
