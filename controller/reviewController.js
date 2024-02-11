// All Reuired Modules
const catchAsync = require("../utils/catchAsync");
const Review = require("./../models/reviewModel");
const factory = require("./../controller/handllerFactory");
const AppError = require("./../utils/appError");

// Top Middlewares
exports.getLoggedInUserIDandTourId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Factory Handller for Update and Delete, Create, Get.. Review
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.writeAReview = factory.createOne(Review);
exports.getOneReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
