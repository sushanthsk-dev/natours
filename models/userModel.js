const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter a name'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, //Converted into lowercase
    validate: [validator.isEmail, 'Please enter a validate email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'tour', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please enter a password once again'],
    validate: {
      //This only works on CREATE and SAVE!!!
      validator: function (el) {
        return this.password === this.passwordConfirm; //abc === abc
      },
      message: 'Passwords are not the same! ',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
  },
});
userSchema.pre('save', async function (next) {
  // Only run this function if password is actually modified
  if (!this.isModified('password')) return next();
  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  console.log(this.password);
  next();
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //bcz if we dnt subtract 1000 then thr will be prnblm to login becuase of
  //timestamp sometimes this will be less then the time of chgnd password tym
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  console.log(await bcrypt.compare(candidatePassword, userPassword));
  //this.password; //not available bcz we used select is false
  return await bcrypt.compare(candidatePassword, userPassword); //candidate password which is coming from user
};

userSchema.methods.changedPasswordAfter = function (JWTtimestap) {
  //basically we pass JWT timestamp which says when token was issued
  //we default  return false tht the user has not changed his password after the token was issued
  if (this.passwordChangedAt) {
    const changedTimestap = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10 //specify the base base 10 number
    ); //basically it in miliseconds to convert into seconds we use divde by 1000
    // console.log(changedTimestap, JWTtimestap);
    return JWTtimestap < changedTimestap; // the time which the token was issued is less than the changed password time
    // 100<200
    //password changed after the token issued
  }

  //False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //digest the resetTOken into hexDecimal update where the randomebyte stored
  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = new mongoose.model('User', userSchema);

module.exports = User;
//Fat models thin controllers
