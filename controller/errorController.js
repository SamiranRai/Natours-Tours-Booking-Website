const AppError = require("./../utils/appError");

// JSON-WEB TOKEN ERRORS HANDLE
//1) handling invalid token error...
const handleJsonWebTokenError = () =>
  new AppError("Invalid Token! please login again...", 401);
//2) handling expired token error...
const handleTokenExpiredError = () =>
  new AppError("Token has been expired! please login again...", 401);

//OTHER ERRORS
const handleCastErrorDB = (err) => {
  const message = `Cant find this ${err.path}: ${err.value}. please check the I'd again and search!.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  //Finding the what is the property name of duplicate
  let duplicateName = err.keyPattern;
  duplicateName = Object.keys(duplicateName)[0];
  //extracting the duplicate value form {error}
  const duplicateValue = err.keyValue.name;

  const message = `this "${duplicateName}: ${duplicateValue}" is already exist, please try different "${duplicateName}" ...`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data, ${errors.join(". ")}`;

  return new AppError(message, 400);
};

const sendErrorProd = (err, res) => {
  // OPERATIONA ERROR: TRUSTED ERROR, OR ERROR BY USER LIKE WRONG INPUT!
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // PROGRAMMING ERROR: DON'T LEAK TO THE CLIENT
    // LOG ERROR!
    console.error("ERROR 💣", err);

    // RESPONSING A GENERIC MESSAGE
    res.status(500).json({
      status: "error",
      message: "Something very went wrong...",
    });
  }
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = JSON.stringify(err);
    error = JSON.parse(error);

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJsonWebTokenError();
    if (error.name === "TokenExpiredError") error = handleTokenExpiredError();

    sendErrorProd(error, res);
  }

  //next();
};
