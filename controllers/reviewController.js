const Review = require('../Models/reviewModel');
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const handlerFactory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.createReviewMiddleware = (req, res, next) => {
  // allow nested routes --> if tour or user ids are not specified in req.body, we can manually add the ids to req.body.
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.checkReviewAuthor = catchAsyncErrors(async (req, res, next) => {
  const reviewUserId = await Review.findById(req.params.id);
  if (reviewUserId.user.id !== req.user.id) {
    return next(new AppError(`You can't edit other people's reviews.`, 403));
  }
  next();
});

/* // Users can only update review and rating fields
exports.checkJSONReviewFields = (req, res, next) => {
  if (!req.body.review) {
    req.body = {
      rating: req.body.rating,
    };
  } else if (!req.body.rating) {
    req.body = {
      review: req.body.review,
    };
  } else {
    req.body = {
      review: req.body.review,
      rating: req.body.rating,
    };
  }
  next();
}; */

exports.getAllReviews = handlerFactory.getAll(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review, 'review', 'rating');
exports.getSingleReview = handlerFactory.getOne(Review);
