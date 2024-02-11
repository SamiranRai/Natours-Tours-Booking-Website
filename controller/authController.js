const crypto = require("crypto");
const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const jwt = require("jsonwebtoken");
const sendEmail = require("./../utils/email");

let counter = 0;

const signToken = (id) => {
  //return is compalsary because it returns
  return jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOpt = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOpt.secure = true;

  res.cookie("jwt", token, cookieOpt);

  //Remove Password and Active field from output
  user.password = undefined;
  user.active = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    photo: req.body.photo,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //Send the email verification Code
  //Generate the random reset Token
  const random4DigitNumber = newUser.createEmailVerificationToken();

  //save the crucial data on db
  await newUser.save();

  //Customized the Msg
  const message = `You'r four digit verification code is here ${random4DigitNumber}.. please Verify within 10 Minutes...`;

  //send the email with the 4-Digit Code...
  try {
    await sendEmail({
      email: newUser.email,
      subject: "Verification Code For singup!",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "4 Digit Code is Successfully Sent to your Email.. 😎",
    });
  } catch (err) {
    newUser.EmailVerificationToken = undefined;
    newUser.emailVrfCodeExpires = undefined;
    await newUser.save();

    return next(
      new AppError(
        "There is an error sending the email.. please try again later",
        500
      )
    );
  }
});

exports.verifyTheEmailCode = catchAsync(async (req, res, next) => {
  //Get the user based on 4 digit Code to match the code

  const fourDigitCode = req.body.fourDigitCode;

  const hashed4DigitNumber = crypto
    .createHash("sha256")
    .update(fourDigitCode.toString())
    .digest("hex");

  //we will match the code
  const user = await User.findOne({
    EmailVerificationToken: hashed4DigitNumber,
    emailVrfCodeExpires: { $gt: Date.now() },
  });

  //If 4 Digit code is correct and not expired then verification is complete
  if (!user) {
    return next(
      new AppError("The Code is not correct or Time is over resent again", 400)
    );
  }

  //set the "emailVerified" to true if email is successfully verified
  user.emailVerified = true;
  await user.save();

  //send back a response
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // sam@gmail.com p - ss , -3 times // ram@gmail.com

  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Please provide your email or password", 400));

  //1: check if entered email is exist
  const user = await User.findOne({ email }).select("+password +emailVerified");
  console.log(user);
  if (!user || !(await user.correctPassword(password, user.password))) {
    /*  if (user.email === req.body.email) {
              counter += 1;
          } else if 
          if (counter >= 3) {
              return res.status(400).json({
                  status: "Login Limit = 3",
                  user: user,
                  count: counter
              });
          }*/
    return next(new AppError("Invalid email or Wrong password !", 401));
  }

  if (!user.emailVerified) {
    return next(new AppError("Please Confirm your email First...", 400));
  }

  //send back a response
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  const authorization = req.headers.authorization;
  let token;
  if (authorization && authorization.startsWith("Bearer")) {
    token = authorization.split(" ")[1];
    //for checking token
    console.log(token);
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. please login to get access", 401)
    );
  }

  //Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);
  console.log(decoded);

  // check token user exists or not!

  const currentUser = await User.findById(decoded.id);
  console.log(currentUser);

  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  //change if it's password changed after issued the token
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  //GRANT, ACCESS
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // roles ['admin', 'lead-guide']
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permisson to perform this action!", 403)
      );
    }

    next();
  };
};

/* exports.restrictToo = (req, res, next) => {
    const roles = ['admin', 'lead-guide'];
    if (!roles.includes(req.user.role)) {
        return next(new AppError('You do not have permisson to perform this action!', 403));
    }

    next();
} */

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on POSTED emial
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }
  // generate random reset token
  const resetToken = user.createPasswordResetToken();
  //the data is modifiying but not saved in DB
  await user.save({ validateBeforeSave: false });

  // send token back to the user email
  const resetUrl = `${req.protocol}//:${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password! update your new password with this Url:${resetUrl}.\n if you don't forgot your password ignore this message!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset Token (valid for only 10 minutes)!",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Email have successfully sent 😎",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There is an error sending an email.. please try again later",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) Check the user are exist and the token is not expired also Set a new Password "Update"
  if (!user) {
    return next(new AppError("Token is invalid or Token has Expired", 400));
  }

  //updating the newwww password and undefind the PRT,PRE..
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) change the changedPasswordAt

  //4) Send new token to the user
  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from the collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) check if Posted user password is correct or not
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(
      new AppError(
        "Current password is wrong! Please enter Right Password...",
        400
      )
    );
  }

  // 3) then, update it...
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) LogIn, Send new Jwt
  createSendToken(user, 201, res);
});

exports.countCounter = (req, res, next) => {
  counter += 1;
  res.status(200).json({
    status: "success",
    cont: counter,
  });
};
