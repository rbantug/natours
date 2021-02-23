////////////////////////////////////////
// For Configuring Express Application only
////////////////////////////////////////

const express = require('express');
const morgan = require('morgan');

const app = express();
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRouter');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
// const { getAllTours } = require('./controllers/tourController');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//========================================
//MIDDLEWARE
//========================================

app.use(cors({
  origin: `127.0.0.1:${process.env.PORT}`,
  credentials: true,
}));

/////////////////////////
// Serving Static Files
/////////////////////////

// In order to access static files (html, images, css, etc) in our file system, we will use express.static():

app.use(express.static(path.join(__dirname, 'public')));

// In a browser, we can now access the html thru: 'http://localhost:3000/overview.html'. The folder 'public' is not included because 'public' will act as the root folder and express will find the file in the 'public' folder.

// When the icons, images and other resources are being retrieved, we will implicitly direct their links to the root by adding '/' at the start of the link so that the request will pass thru this middleware and it will direct the request to the public folder. Without '/', the request will assume that path is 'localhost:8000/tour/img/sample-image' instead of 'localhost:8000/public/img/sample-image'.

/////////////////////////////
// Set security HTTP headers
/////////////////////////////

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
  })
);

// Development logging

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// morgan is a middleware that allows us to easily log requests, errors, and more to the console. We will add a functionality to make it run when the environment is development

///////////////////////////////////
// Limit request from the same IP
///////////////////////////////////

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many request. Please try again later after 1 hour.',
});

app.use('/api', limiter);

// The 'limiter' function is a middleware. Since we want all request that will go to the api to pass through this middleware, we will be using 'app.use()'.

////////////////////////////////////////
// Body-parser. Creates 'req.body' object
////////////////////////////////////////

app.use(express.json({ limit: '10kb' }));

// express.json() is a middleware. Middlewares are functions that can modify the incoming request data. For more info --> http://expressjs.com/en/guide/writing-middleware.html

// 'limit' is an option that will prevent us from accepting a body larger than 10kb

// Because this middleware was placed before the other middlewares (routes), this middleware will run first in the middleware stack / request-response cycle.

///////////////////////////////////
// Cookie Parser
///////////////////////////////////

app.use(cookieParser());

///////////////////////////////////
// Data Sanitization against NoSQL query injection
///////////////////////////////////
app.use(mongoSanitize());

///////////////////////////////////
// Data Sanitization against Cross Script
///////////////////////////////////
app.use(xss());

///////////////////////////////////
// Prevent HTTP parameter Pollution
///////////////////////////////////
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

/////////////////////////
// Creating Middlewares
/////////////////////////

app.use((req, res, next) => {
  console.log(req.cookies); // This works because of the cookie parser module
  next();
});

// Middleware has access to request, response & next function. The third argument is always for the 'next' function that when invoked, executes the next middleware. Check lesson 58 for the request-response cycle.

/* app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  // console.log(req.reqTime);
  next();
}); */

// In the code above, we'll assume that a route handler needs the current date and time. This is the fastest way

//////////////////////////////////////////
//ROUTES
//////////////////////////////////////////

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//////////////////////////////////////////
// Route for unhandled Routes (URL error)
//////////////////////////////////////////

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `${req.originalUrl} does not exist`,
  // });

  // const err = new Error(`${req.originalUrl} does not exist...yet`);
  // err.statusCode = 404;
  // err.status = 'fail';
  next(new AppError(`${req.originalUrl} does not exist...yet`, 404));
});

// If app.use('/tour'), 'tour/1' will work.

// If app.all('/tour'), '/tour/1' will NOT work.

// app.all takes multiple callbacks, and meant for routing. with multiple callbacks you can filter requests and send responses. app.all will match complete path.

// app.use takes only one callback function and it's meant for Middleware. Middleware usually doesn't handle request and response, (technically they can) they just process input data, and hand over it to next handler in queue. app.use only sees whether url starts with the specified path.

// '*' means anything.

// 'req.originalUrl' is the route url

// Since this is a middleware, it is part of the stack. If the tour & user routes did not match the url route, then app.all('*') will match the url route and it will send the JSON response. If we placed this middleware before the tour and user route middleware, this middleware will always catch all our request regardless if it's a get, post, patch or delete request.

//////////////////////////////////////////
// Global Error Handling Middleware
//////////////////////////////////////////

// This error handling are for operational errors. While each route handler has a catch method for handling errors, it would be best to have a middleware to do all that stuff.

// Error handling middlewares in express have 4 parameters. Express will immediatelly know that this middleware with 4 parameters is the error handling middleware.

app.use(errorController);

// please check errorController.js for more info.

module.exports = app;
