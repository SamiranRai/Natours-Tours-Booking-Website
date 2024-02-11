// All Reuired Modules
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-filters");
const hpp = require("hpp");

// All Router
const tourRouter = require("./Routes/tourRoutes");
const userRouter = require("./Routes/userRoutes");
const reviewRouter = require("./Routes/reviewRoutes");

// All Errors Handller Modules
const AppError = require("./Utils/appError");
const globalErrorHandler = require("./Controller/errorController");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Top Middleware: for dev & production
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global Middlewares

// Serving... static file middleware
app.use(express.static(path.join(__dirname, "public")));

//Set security HTTP headers
app.use(helmet());

// It blocks more-than 100 req. in 1Hr from same IP Adresss - to
// prevent the app form BRUTE-FORCE || DDoS and so many Attacks
const limitter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "To many request form this Ip Address...",
});

app.use("/api", limitter);

// Getting Data form Body Middleware
app.use(express.json({ limit: "10kb" }));

// Sanitize the Data against NoSQL query attack!
app.use(mongoSanitize());

// Sanitize the data against XSS
// app.use(xss());

// Prevent from parameter polution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "price",
      "difficulty",
    ],
  })
);

// Test Middleware
app.use((req, res, next) => {
  console.log("Hello from the middleware ðŸ‘‹");
  console.log(req.headers);
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.get("/", (req, res) => {
  res.status(200).render("base", {
    tour: "The Forest Hiker",
    user: "Jonas",
  });
});

// 3) All ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Error for Undefind route
app.all("*", (req, res, next) => {
  /* const err = new Error(`Can't find this ${req.originalUrl} route on this server...`);
    err.statusCode = 404;
    err.status = 'fail'; */

  next(
    new AppError(
      `Can't find this ${req.originalUrl} route on this server...`,
      404
    )
  );
});

// Global error handler Middleware
app.use(globalErrorHandler);

// App Running Port & Mode Message..
console.log(`App is running in ${process.env.NODE_ENV} mode.`);

module.exports = app;
