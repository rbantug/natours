const stripe = require('stripe')(process.env.STRIPE_SECRETKEY);
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const AppError = require('../utils/appError');
const Tour = require('../Models/tourModel');
const Booking = require('../Models/bookingModel');
const handlerFactory = require('./handlerFactory');
const User = require('../Models/userModel');

exports.getCheckoutSession = catchAsyncErrors( async (req, res, next) => {

  // 1. Get the currently booked tour
  const tour = await Tour.Tour.findById(req.params.tourID);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
   payment_method_types: ['card'],
   mode: 'payment',
   // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
   success_url: `${req.protocol}://${req.get('host')}/`,
   cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
   customer_email: req.user.email,
   client_reference_id: req.params.tourID,
   line_items: [
     {
      quantity: 1,
      price_data: {
        unit_amount: tour.price * 100,
        currency: 'usd',
        product_data: {
          name: `${tour.name} Tour` ,
          description: tour.summary,
          images: ['https://media-cdn.tripadvisor.com/media/photo-s/0b/22/72/23/place-plum-tours.jpg']
        }
      }  
    }
  ]
 })
   
  // 3. Create session as response
 res.status(200).json({
   status: 'success',
   session
 })
});

// THIS IS TEMPORARY SOLUTION -- createBookingCheckout is not safe since anyone who knows the tour id, the user id and the price can book a tour without paying for it.


/* exports.createBookingCheckout = catchAsyncErrors( async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();
  
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
  next();
}) */

const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_details.email })).id;
    const price = session.amount_total / 100;
  
    await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
    res.status(200).json({received: true});
  } 
};

exports.getAllBookings = handlerFactory.getAll(Booking);
exports.getSingleBooking = handlerFactory.getOne(Booking);
exports.createBooking = handlerFactory.createOne(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);
