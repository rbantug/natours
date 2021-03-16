const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const User = require('../Models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 3600000), // 2 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  // Remove password from response JSON
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsyncErrors(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/myAccount`;
  await new Email(newUser, url).sendWelcome();
  sendToken(newUser, 201, res);
});

// 'newUser' was edited from 'const newUser = await User.create(req.body)' to what it is right now. The problem with passing the whole req.body is that new users can manipulate the data like making themselves the admin. By limiting what data gets to the new document, we will be able to avoid problems.

// JSON web token creates an encrypted data that will enable the client to authenticate the user.

exports.login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  // ES6 destructuring, it's the same with email = req.body.email & password = req.body.password

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400)); // 400 -> bad request
  }
  // 2. Check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401)); // 401 -> unauthorized error
  }

  // 3. If everything is ok, send token to user client
  sendToken(user, 200, res);
});

// regarding 'User.findOne({ email }).select('+password')' --> In userModel.js, we added the schemaoption 'select' to remove the password in the query everytime we request it. It will not show up in the JSON. In order to get that password back, we will add '.select('+password')' in findOne()

exports.protect = catchAsyncErrors(async (req, res, next) => {
  let token;
  // 1. Getting token and check if it exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //console.log(token);

  if (!token) {
    return next(new AppError('You are not logged in.', 401));
  }
  // 2. Token verification
  const verifyPromise = promisify(jwt.verify);
  const decodedData = await verifyPromise(token, process.env.JWT_SECRET);
  // 3. Check if the user still exist
  const currentUser = await User.findById(decodedData.id);
  if (!currentUser) {
    return next(new AppError('This account does not exist', 401));
  }
  // 4. Check if the user changed the password after the JWT was issued
  if (currentUser.changedPasswordAfter(decodedData.iat)) {
    return next(new AppError('The user recently changed the password.', 401));
  }
  req.user = currentUser; // freshUser will be available in the next middleware / route handler
  res.locals.user = currentUser;
  next();
});

// it is a common practice to send tokens using a http header.
// There is a standard when sending a token thru the header. The key should be 'Authorization' and the value should always start with a 'Bearer' and then the token
// 'decodedData.iat' is a timestamp of when the JWT was created.

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decodedData = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // Check if the user still exist
      const currentUser = await User.findById(decodedData.id);
      if (!currentUser) {
        return next();
      }
      // Check if the user changed the password after the JWT was issued
      if (currentUser.changedPasswordAfter(decodedData.iat)) {
        return next();
      }
      // There is a logged in user
      res.locals.user = currentUser; // instead of req.user, we will use 'res.locals'. 'res.locals' can store variables that our pug template can access.  --> http://expressjs.com/en/5x/api.html#res.locals
      return next();
  
    }
    next();  
  } catch (err) {
    if (err.message === 'jwt expired') {
      res.clearCookie('jwt');
      return next(new AppError('You session has expired. Please login again.', 401));
    }
  }
  
};

// promisify(jwt.verify) will become a promise based API. This code will run first and then it will do its jwt.verify thing with the token and the secret code.

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }
    next();
  };
};

// Since middlewares can't accept parameters, we will wrap the middleware in a function. By immediately returning the middleware, we will be able to access the rest parameter (...roles).

// restrictedTo() can accept multiple parameters, which will become an array because of the rest parameter. We will be able to use that array to check if the user that logged in has the same role with those in the array. Take note that in the 'protect' middleware, we assigned currentUser to req.user, which means that we can access the 'role' of the user.

// We will compare the values of '...roles' with 'req.user.role' to check if the user has the authority to proceed to the next middleware/route handler.

///////////////////////////////////////////
// Password Recovery
///////////////////////////////////////////

// This involves 2 routes, forgotPassword will require the user to submit their email so that we can verify if the user do exist and then send a random token to their email, and resetPassword will receive the token and the new password from the user.

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // 1. Get user info from database based on email and verify
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // 2. Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // the instanced method 'createPasswordResetToken()' will not implement any changes in the document. We need to call 'user.save()' to add the 'passwordResetToken' & 'passwordResetExpires' to the document.

  // 'validateBeforeSave' is a schema option that disable validation before saving a document in the database. If we did not disable the validation, it will throw errors because we required the documents to have an email, a name and other required fields.

  /* res.status(200).json({
    message
  }) */

  // 3. Send the token to user email


  // in case of an error in the sendEmail(), which is a promise, we can't just send errors using catchAsyncErrors(), we need to delete the values of passwordResetToken and passwordResetExpires. We will use a try/catch block.
  try {
    /* const resetHTML = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/resetPassword/${resetToken}`; */

    const resetHTML = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword/${resetToken}`;
  
    // 'req.protocol' will contain the request protocol string which is either HTTP or https.
    
    new Email(user, resetHTML).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Please try again.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. Check if token has not expired and user exist in the database. If both are true, set the new password

  if (!user) {
    return next(
      new AppError('The password reset token is invalid or has expired', 400)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save(); //  we want to validate the password & passwordConfirm

  // 3. Update passwordChangedAt property
  // We will create a pre save hook that will check if the password was modified. If it was modified, we will update the 'passwordChangedAt' property.

  // 4. Log in user, send JWT
  sendToken(user, 200, res);
});

///////////////////////////////////////////
// Let logged in users update their password
///////////////////////////////////////////

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('This account does not exist', 401));
  }

  // 2. Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('Wrong Password', 401));
  }
  // 3. If so, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4. log user in and send JWT
  sendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.clearCookie('jwt'); // probably a better solution??
  res.status(200).json({ status: 'success' });
}

/* exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10000), // 10 sec
    httpOnly: true,
    //secure: process.env.NODE_ENV === 'production',
  });
  res.status(200).json({ status: 'success' });
} */

// secure option was not included because there are no sensitive data in the cookie.

exports.preventLogin = (req, res, next) => {
  if (res.locals.user) {
    return next(new AppError('You are already logged in', 403));
  }
  next();
}

exports.preventMyAccountAccess = (req, res, next) => {
  if (!res.locals.user) {
    return next(new AppError('Please log in', 403));
  }
  next();
}

exports.validateResetPasswordToken = catchAsyncErrors( async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError('The password reset token is invalid or has expired', 400)
    );
  }
  next();
})