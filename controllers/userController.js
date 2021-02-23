const User = require('../Models/userModel');
const AppError = require('../utils/appError');
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const handlerFactory = require('./handlerFactory');
const filterObj = require('../utils/filterObj');

/* const filterObj = (obj, ...allowedfields) => {
  let newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedfields.includes(el)) newObj[el] = obj[el];
  })
  return newObj;
}; */

// Object.keys() returns an array. It converts the keys/fields in the object into an array.

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.getAllUsers = handlerFactory.getAll(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.getSingleUser = handlerFactory.getOne(User);

///////////////////////////////////
// Let logged in user change the name and email only
///////////////////////////////////

exports.updateMe = catchAsyncErrors(async (req, res, next) => {
  // 1. check if user will update the password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You are not allowed to change your password in this route. Please use /updateMyPassword',
        400
      )
    );
  }

  // 2. update name and/or email
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // Since this route handler is for updating the name and/or email, we can use findByIdAndUpdate().
  // filterObj() function accepts 2 parameters, the unfiltered request body and the fields that we will accept in the filtered object.

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsyncErrors(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Do NOT update password with this route. Use updateMe
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
