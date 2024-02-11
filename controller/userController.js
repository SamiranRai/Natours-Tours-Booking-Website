// All Reuired Modules
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./../controller/handllerFactory");

// Top Middleware
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Filter The Fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Update the User-Data
exports.updateMe = catchAsync(async (req, res, next) => {
  //check if user POsted password for update
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is only for user update not password update.. use 'reset Password or forgot Password' to update the password",
        400
      )
    );
  }
  //filteration
  const filterBody = filterObj(req.body, "name", "email");
  //update the user
  const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });
  // Send back response to the user
  res.status(200).json({
    status: "success",
    data: {
      user: updateUser,
    },
  });
});

// Delete the User(Virtulay, Not form DB, But Like Deactivated!)
exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
  });
});

// ____
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not for creating a user, use signup for that",
  });
};

// Factory Controller For Update and Delete, Get.. User
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
