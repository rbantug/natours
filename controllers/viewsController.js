const Tour = require('../Models/tourModel');
const Booking = require('../Models/bookingModel');
const AppError = require('../utils/appError');
const catchAsyncErrors = require('../utils/catchAsyncErrors');

exports.getOverview = catchAsyncErrors(async (req, res, next) => {
  const tours = await Tour.Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsyncErrors(async (req, res, next) => {
  const singleTour = await Tour.Tour.findOne({
    slug: req.params.slug,
  }).populate({ path: 'reviews', select: '-tour review rating user' });
  //console.log(singleTour);
  if (!singleTour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  res
    .status(200)
    .set("default-src 'self' https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com; base-uri 'self'; block-all-mixed-content; connect-src 'self' https://js.stripe.com/v3/ https://cdnjs.cloudflare.com/ https://*.mapbox.com/; font-src 'self' https://fonts.google.com/ https: data:;frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self' https://js.stripe.com/v3/ https://cdnjs.cloudflare.com/ https://api.mapbox.com/ blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"
    )
    .render('tour', {
      title: singleTour.name,
      singleTour,
    });
});

/* 'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;" */

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.myAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account'
  });
}

exports.signup = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign Up'
  });
}

exports.resetPassword = (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset Password'
  });
}

exports.forgotPassword = (req, res) => {
  res.status(200).render('forgotPassword', {
    title: 'Type in your email address'
  });
}

exports.splashPageAfterForgotPassword = (req, res) => {
  res.status(200).render('splashPageAfterForgotPassword', {
    title: 'Email Sent!'
  });
}

exports.getMyBookings = catchAsyncErrors(async (req, res, next) => {

  // 1. Find all bookings
  const bookings = await Booking.find({ user: req.user.id }).populate('tour');
  // 2. find tours with the returned IDs
 
  const tours = bookings.map(el => el.tour);
  //const tours = await Tour.Tour.find({_id: {$in: tourIds}});

  res.status(200).render('overview', {
    title: 'My Bookings',
    tours
  });
});

exports.alert = (req, res, next) => {
  const alert = req.query.alert;

  if (alert === 'booking') {
    res.locals.alert = 'Your booking was successful! If your booking doesn\'t show up here immediately, please come back later.';
  }
  next();
}
