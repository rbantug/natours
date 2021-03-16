const User = require('../Models/userModel');
const AppError = require('../utils/appError');
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const handlerFactory = require('./handlerFactory');
const filterObj = require('../utils/filterObj');
const multer = require('multer');
const sharp = require('sharp');

/* const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
}) */

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb (new AppError('Only photos can be uploaded', 400), false);
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo')

exports.editUserPhoto = catchAsyncErrors( async (req, res, next) => {
  if (!req.file) return next()

  req.file.filename = `user-${req.user.id}.jpeg`

  await sharp(req.file.buffer)
  .resize(500, 500)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/users/${req.file.filename}`);

  next();
})

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
/*   console.log(req.file);
  console.log(req.body); */
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
  if (req.file) filteredBody.photo = req.file.filename;
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
exports.updateUser = handlerFactory.updateOne(User, 'email',
'role',
'name',
'photo'); 
exports.deleteUser = handlerFactory.deleteOne(User);
