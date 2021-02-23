const catchAsyncErrors = require('../utils/catchAsyncErrors');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const filterObj = require('../utils/filterObj');

exports.deleteOne = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('This document does not exist', 404));
    }

    res.status(204).json({
      status: 'success',
      message: 'document was deleted',
    });
  });

exports.updateOne = (Model, ...acceptFields) =>
  catchAsyncErrors(async (req, res, next) => {
    if (acceptFields) req.body = filterObj(req.body, ...acceptFields);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('This document does not exist', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        result: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsyncErrors(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);
    const doc = await query;

    if (!doc) {
      return next(new AppError('This document does not exist', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId)
      filter = {
        tour: req.params.tourId,
        //user: '600be3ad0252d616f26d9ecc'
  
        // If we want to filter the user too. Since user field will be populated via virtual populate, we can directly query the 'user' field instead of 'user._id'
      };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const allDocs = await features.query.explain();
    const allDocs = await features.query;

    res.status(200).json({
      status: 'success',
      result: allDocs.length,
      data: allDocs,
    });
  });
