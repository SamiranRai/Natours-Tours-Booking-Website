// All Reuired Modules
const express = require("express");
const tourController = require("../Controller/tourController");
const authController = require("../Controller/authController");
const reviewRouter = require("./reviewRoutes");

// Router
const router = express.Router();

// Nested Routes
router.use("/:tourId/reviews", reviewRouter);

// Find Tour WithIn Range
////tours-within/200/center/10,-40/unit/km
router
  .route("/tours-within/:distance/center/:latlong/unit/:unit")
  .get(tourController.getToursWithIn);

// Get Distances of tour From ceratin point
router.route("/distance/:latlong/unit/:unit").get(tourController.getDistances);

// Routes
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Routes
router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.getMonthlyPlan
  );

// Routes
router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

// Routes
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
