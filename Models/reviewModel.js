// review text, rating, createdAt, ref to tour, ref to user

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review without a review is not a review'],
      default: 'tur is gud!',
    },
    rating: {
      type: Number,
      min: [1, 'The rating should be more or equal to 1'],
      max: [5, 'The rating should be less or equal to 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'a review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'a review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Preventing Duplicate Reviews by a single user

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  /* this.populate({
    path: 'user',
    select: 'name photo',
  }).populate({
    path: 'tour',
    select: '-guides name',
  }); */

  // Removed the populate for tour model because it will show up if query (find) any tour. Redundant.

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

/////////////////////////////////////
// Calculating the Average Rating and Total number of review per Tour
/////////////////////////////////////

// When saving or creating a new review

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].numRating,
    });
  } else {
    // default value if all reviews were deleted
    await Tour.Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 3,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post(/save|^findOneAnd/, (doc, next) => {
  doc.constructor.calcAverageRatings(doc.tour);
  next();
});

// 'findOneAnd' will match findOneAndUpdate which is same as findByIdAndUpdate & findOneAndDelete which is same as findByIdandDelete

/* reviewSchema.post('save', function () {
  // 'this' refers to the document
  this.constructor.calcAverageRatings(this.tour);
}); */


// When updating or deleting a review

/* reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  await doc.constructor.calcAverageRatings(doc.tour);
  next();
}); */

// post query middleware can have 2 parameters, 1st is doc, 2nd is next. 'doc' is the result of the query. So in the code above, 'doc' refers to the updated review. This means that we don't need to do a pre & post middleware.

// Another longer solution

/* reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
}); */

// The middleware is a query middleware. 'this' is the query and not the document. If we don't have access to the document, we can't get the tourID to run calcAverageRatings().

// A workaround is to run 'this.findOne()' and save it to 'this'. findOne() will return the review before any changes are made. Please note that we are using a pre-find middleware.

// Why not just place 'await this.findOne()' in the post middleware? Because in the post middleware, the query was already executed. 'this' no longer has any value except if we add a new property, which in this case is 'r'

// Another problem is that if we access the review in the database, it is not yet updated because this is a PRE-find middleware. We need to create a POST-find middleware to access the current review.

/* reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
}); */

// Since we have access to 'this', we will use it to transfer the review from pre to post.

// As for the 'Review' model, another workaround is to use 'this.r' and connect it with the .constructor.

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
