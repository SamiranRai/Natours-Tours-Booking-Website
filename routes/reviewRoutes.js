// All Reuired Modules
const express = require("express");
const authController = require("../Controller/authController");
const reviewController = require("../Controller/reviewController");

// Router, mergeParams: merge the parameter
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Routes
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.getLoggedInUserIDandTourId,
    reviewController.writeAReview
  );

// Routes
router
  .route("/:id")
  .get(reviewController.getOneReview)
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview
  );

module.exports = router;
