const express = require('express');

const router = express.Router({
  mergeParams: true,
});

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

router.use(authController.protect);

router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.restrictedTo('user'),
    reviewController.createReviewMiddleware,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(
    authController.restrictedTo('admin', 'user'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictedTo('admin', 'user'),
    reviewController.checkReviewAuthor,
    reviewController.updateReview
  )
  .get(reviewController.getSingleReview);

module.exports = router;
