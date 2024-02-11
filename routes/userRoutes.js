// All Reuired Modules
const express = require("express");
const userController = require("./../controller/userController");
const authController = require("./../controller/authController");

// Router
const router = express.Router();

// THIS ROUTE IS ONLY FOR ANY AUTHANTICATION PROCESS!
router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.post("/verifyCode", authController.verifyTheEmailCode);
router.get("/count", authController.countCounter);

// Routes
router.use(authController.protect);

// User Data Update
router.patch("/updateMyPassword", authController.updatePassword);

router.patch("/updateMe", userController.updateMe);

router.delete("/deleteMe", userController.deleteMe);

router.get("/me", userController.getMe, userController.getUser);

router.use(authController.restrictTo("admin"));

// Routes
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

// Routes
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
