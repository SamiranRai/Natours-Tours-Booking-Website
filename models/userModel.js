// All Reuired Modules
const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email!"],
    unique: true,
    validate: [validator.isEmail, "Please provide a Valid Email Id"],
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Please provide your Password!"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    validate: {
      // this method only work for create() and save() method ONLY!
      validator: function (passwordConfirm) {
        return this.password === passwordConfirm; // return true or false
      },
      message: "password are not same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  EmailVerificationToken: String,
  emailVrfCodeExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
    select: true,
  },
});

// Pre Query-Middleware
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// DOCUMENT MIDDLEWARE:
//NOTE: bcrypt.hash() is a async function!
// pass 1 - pass2(not hashed but modified)
// new user  - pass 1(not hashed )
userSchema.pre("save", async function (next) {
  // check if passowrd is not modified. (this="current document object")
  if (!this.isModified("password")) return next();

  //hashing the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //deleting "passwordConfirm" field
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now - 1000;

  next();
});

// User-Method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, { hashedToken: this.passwordResetToken });

  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const random4DigitNumber = Math.floor(Macth.random() * 9999) + 1000;

  const hashed4DigitNumber = crypto
    .createHash("sha256")
    .update(random4DigitNumber.toString())
    .digest("hex");

  // modifying the data
  this.EmailVerificationToken = hashed4DigitNumber;
  this.emailVrfCodeExpires = Date.now() + 10 * 60 * 1000;

  //log to the console
  console.log(
    { randomNumber: random4DigitNumber },
    { hashed4DigitNumber: hashed4DigitNumber }
  );

  return random4DigitNumber;
};

//Model
const User = mongoose.model("User", userSchema);

module.exports = User;
