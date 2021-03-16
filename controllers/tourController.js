/* eslint-disable node/no-unsupported-features/es-syntax */
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../Models/tourModel');
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const handlerFactory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

exports.uploadTourPhotos = upload.fields([
  {name: 'imageCover', maxCount: 1},
  {name: 'images', maxCount: 3}
]);

exports.processTourPhotos = catchAsyncErrors( async (req, res, next) => {
  console.log(req.files);

  if (!req.files.imageCover || !req.files.images) next();

  req.body.imageCover = `tour-${req.params.id}-cover.jpeg`

  await sharp(req.files.imageCover[0].buffer)
  .resize(2000, 1333)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/tours/${req.body.imageCover}`);

  // let imageFilename = `tour-${req.params.id}-${Date.now()}-image.jpeg`;

  req.body.images = [];
  
  await Promise.all(req.files.images.map( async (el, i) => {
    const imageFilename = `tour-${req.params.id}-image-${i + 1}.jpeg`;
    await sharp(el.buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${imageFilename}`); 

    req.body.images.push(imageFilename);
  }));
  /* req.body.images = req.files.images.map(async (el) => {
    await sharp(el.buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${imageFilename}`);
  }) */

  next();
});

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = handlerFactory.getAll(Tour.Tour);
exports.getSingleTour = handlerFactory.getOne(Tour.Tour, { path: 'reviews' });
exports.createTour = handlerFactory.createOne(Tour.Tour);
exports.updateTour = handlerFactory.updateOne(Tour.Tour, 'startLocation',
'ratingsAverage',
'ratingsQuantity',
'startDates',
'name',
'duration',
'maxGroupSize',
'difficulty',
'price',
'summary',
'imageCover',
'images',
'locations');
exports.deleteTour = handlerFactory.deleteOne(Tour.Tour);
exports.getBookingsPerTour = handlerFactory.getOne(Tour.Tour, 'bookings');

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
