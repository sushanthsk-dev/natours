const crypto = require('crypto');
const { promisify } = require('util'); // Promsifying  method //es6 destructuring
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('./../utils/email');
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXIPRE_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //browser or client in general will delete the cookie after it has expired
    //secure: true, //Will send it in https
    httpOnly: true, //That thte cookie Cannot be accessed and modified in any way in the browser in order to prevent corss site preventing
    //hhtpOnly recive the cookie and store it and then send it automatically along with every request
  };
  //how to send cookies
  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;
  res.cookie('jwt', token, cookieOption);
  //name of the cookie and the data want to send in the cookie

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res); //201 insertion
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if the email and password exist
  if (!email || !password)
    return next(new AppError('Please proivde email and password', 400));

  // 2) Check if the user exists and password is correct

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrected email or password', 401));
  }
  // console.log(user);
  // 3) IF everything ok,send token to client

  createSendToken(user, 200, res);
});

//Middleware function

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    // console.log(req.headers.authorization);

    //console.log('TOKEN', token);
    return next(
      new AppError('Your are not logged in! Please log in to get access', 401) //401 for unathorization
    );
  }
  // 2) Verification token //jwt algoirthm verify wthether the token is valid or not
  // If someone is manipulated  or also if token  is alrdy expired
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // call the function  tht will return a function
  // the result of the promise actually the decoded data(decoded payload from JWT)
  // the user  for which we have issued the JWT is exactly one whose ID is now inside of decoded payload
  // console.log(decoded);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  //console.log('Fresh USer', currentUser);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }
  // 4)Check if user changed password after the token issued
  // console.log(currentUser.changedPasswordAfter(decoded.iat));
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //iat means issued at
    return next(
      new AppError('User recently changed password!Please log in Again.', 401)
    );
  }

  //Grant access  to the protected route
  req.user = currentUser; //so tht we can use in the next middleware bcz req object tht travels from middleware to middleware
  //if we want to pass data from one middleware to  next one then we can simply put some stuff on the request object
  //then that data will be available at a later point
  //This is very complete routing protecting algorithm
  res.locals.user = currentUser;

  next();
});

// Only for rendered pages, no errors!

exports.isLoggedIn = async (req, res, next) => {
  console.log(req.cookies.jwt);
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        //iat means issued at
        return next();
      }
      // THERE IS LOGGED IN USER
      res.locals.user = currentUser; // each and every pug templates will have access to response.locals
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

//Autorization admin role

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    ///roles is an array ['admin','lead-guid'] . role='user
    //  console.log(roles);
    if (!roles.includes(req.user.role)) {
      // it came from previous middleware
      return next(
        new AppError('YOu do not have permission to perform this action', 403) //forbidden
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get User based on POSTed email
  ///console.log(req.body.email);

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  //2)Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //deactivate the validate BeforeSave
  //3) send it to user's email

  //protcol http or https

  // const message = `Forgot your password? Submit a PATCH request qith your new password
  // and passwordConfirm to: ${resetURL}. \n If you didn' t forget your password, Please ignore this email!`;
  try {
    //   console.log(user.email);

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10min)',
    //   message,
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    //this only modify the data dnt save it in databse
    //  console.log(err);
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email.Try again later!', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get User based on th token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //console.log('Hasheds', hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });
  // 2) If toekn has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has exp0eired', 400));
  }

  //3) Update changedPAssword Property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //4) Log the user in,send JWT
  //

  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  console.log(req.body);
  //2) CHeck if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 400));
  }
  //3) If so,Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User.findByIdandUPdate will not work as intended;
  //Log user in,send JWT

  createSendToken(user, 201, res);
});
