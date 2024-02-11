// All Reuired Modules
const mongoose = require("mongoose");
const Tour = require("./tourModel");

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "a review cannot be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "review must belong to the tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "review must belong to the user"],
    },
  },
  {
    // Virtual Property
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.indexes({ tour: 1, user: 1 }, { unique: true });

// Pre Query-Middleware
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewSchema.statics.calcRatingsAvg = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        numRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].numRating,
  });
};

reviewSchema.post(/^findOneAnd/, async function (docs) {
  await docs.constructor.calcRatingsAvg(docs.tour);
  console.log(docs);
});

reviewSchema.post("save", function () {
  this.constructor.calcRatingsAvg(this.tour);
});

//Model
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
