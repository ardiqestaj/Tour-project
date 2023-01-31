const User = require('./../models/userModel');
const catchAsync = require('./../utilis/catchAsync');
const AppError = require('../utilis/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Get all Users
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. please use / updateMyPassword',
        400
      )
    );
  }

  //  fields we want to keep on body.request
  // 2) Filtered out unwanted fileds name that are not allowed to be updated
  const filterBody = filterObj(req.body, 'name', 'email');
  // 3) Update user Document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
// non-ative user
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Create User
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do not update password with this
// Update user
exports.updateUser = factory.updateOne(User);
// Delete user
exports.deleteUser = factory.deleteOne(User);
