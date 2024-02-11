// All Reuired Modules
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");

// HANDLING UN-CAUGHT ERROR!
//  why top of all code? ANS -  because it accepts all the error before all the code!
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log('"uncaughtException" Error, SHUTTING DOWN THE SYSTEM!');
  //shutting down the system!
  process.exit(1);
});

// Configuration
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// DB Connect
mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log("DB connection successful!"));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// HADLING UN-HANDLE-REJECTION ERROR!
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log('"unhandledRejection" Error, SHUTTING DOWN THE SYSTEM!');
  //shutting down the system!
  server.close(() => {
    process.exit(1);
  });
});
