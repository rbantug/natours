const Tour = require('../Models/tourModel');
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
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: singleTour.name,
      singleTour,
    });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};
