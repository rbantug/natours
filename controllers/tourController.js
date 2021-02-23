/* eslint-disable node/no-unsupported-features/es-syntax */
const Tour = require('../Models/tourModel');
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const handlerFactory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = handlerFactory.getAll(Tour.Tour);
exports.getSingleTour = handlerFactory.getOne(Tour.Tour, { path: 'reviews' });
exports.createTour = handlerFactory.createOne(Tour.Tour);
exports.updateTour = handlerFactory.updateOne(Tour.Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour.Tour);

exports.getTourStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Tour.Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        totalRating: { $sum: 'ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    /* {
      $match: { _id: { $ne: 'EASY' } },
    }, */
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsyncErrors(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tourName: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: plan.length,
    data: plan,
  });
});

exports.getToursWithin = catchAsyncErrors(async (req, res, next) => {
  const { distance, latlong, unit } = req.params;
  const [lat, long] = latlong.split(',');
  let radius;
  if (unit === 'mi') {
    radius = distance / 3963.2;
  } else if (unit === 'km') {
    radius = distance / 6378.1;
  } else {
    next(new AppError(`The unit should be in 'mi' or 'km' only.`, 400));
  }

  if (!lat || !long) {
    next(
      new AppError(
        `Please add your location in this format: 'latitude,longitude'.`,
        400
      )
    );
  }

  const tour = await Tour.Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    result: tour.length,
    data: {
      tour,
    },
  });
});

exports.getDistance = catchAsyncErrors(async (req, res, next) => {
  const { latlong, unit } = req.params;
  const [lat, long] = latlong.split(',');
  let KiloOrMile;

  if (unit === 'mi') {
    KiloOrMile = 0.00062137119223733;
  } else if (unit === 'km') {
    KiloOrMile = 0.001;
  } else {
    next(new AppError(`The unit should be in 'mi' or 'km' only.`, 400));
  }

  if (!lat || !long) {
    next(
      new AppError(
        `Please add your location in this format: 'latitude,longitude'.`,
        400
      )
    );
  }

  const distance = await Tour.Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [long * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: KiloOrMile,
      },
    },
    {
      $project: {
        distance: 1,
        //startLocation: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: distance,
  });
});
