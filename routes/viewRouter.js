const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');
const app = require('../app');

const router = express.Router();

router.get('/myAccount', authController.protect, viewsController.myAccount);
router.get('/myBookings', authController.protect, viewsController.getMyBookings);
router.get('/signup', viewsController.signup);
router.get('/forgotPassword', viewsController.forgotPassword);
router.get('/resetPassword/:token', authController.validateResetPasswordToken, viewsController.resetPassword);
router.get('/emailSent', viewsController.splashPageAfterForgotPassword);

router.use(authController.isLoggedIn);

router.get('/', bookingController.createBookingCheckout, viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', authController.preventLogin, viewsController.getLoginForm);

module.exports = router;
