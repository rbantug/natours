const express = require('express');

const router = express.Router();

const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

router.get('/checkout-session/:tourID', authController.protect, bookingController.getCheckoutSession);

router.use(authController.protect, authController.restrictedTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getSingleBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
