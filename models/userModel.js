const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your emal'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a passowrd'],
    minlength: 8,
    // not  allow to select password
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confrim your password'],
    validate: {
      // This will work only on save and create!!!
      // We need to write save te update
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // For active and non-active user
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// Between retriving the data and saveit to database, presave do this,
// And we use this to hash password
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // its not important to sent confirm password to db, tha validation will check if the password are the same
  // Delete passwordConfrim field
  this.passwordConfirm = undefined;
  next();
});

// Loking for this word find
// To not show to alluser inactive user
userSchema.pre(/^find/, function (next) {
  // this point to the current query
  this.find({ active: { $ne: false } });
  next();
});

// If password is not change, dont maniplulet passwordChangeAt
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // -1000 because TWS is issue before password changed, and we want
  // to make after
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// instance method and it is avilable in all user document
// If password match
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// When JWTT Issue
// We need to check if password changed after JWTT issue
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // Converet time to same format
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // true if password changed
    return JWTTimestamp < changedTimestamp;
  }
  // False means not changed
  return false;
};
// Reseting password
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  // Valid fore 10mins
  this.passwordResetExpires = Date.now() + 10 * 60 * 10000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
