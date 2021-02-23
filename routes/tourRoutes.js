const express = require('express');
//const app = require('../app');

const router = express.Router();

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

//router.param('id', tourController.checkID);

// Check tourController.js for exports.CheckID --> Whenever we receive a request with the 'id' variable (found below in 'router.route('/:id')'), a middleware (callback function) will run. The middleware can have 4 arguments, req, res, next and value. Value is the value of the 'id' variable found in the url.

// create checkbody middleware
// check if body contains name and price property
// if not, send back status 400

/////////////////////////////
// Route Merging
/////////////////////////////

// We will redirect anything that has to do with the review to the review route.

router.use('/:tourId/reviews', require('./reviewRoutes'));

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

// This is a lesson about aliasing

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlong/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/tour-distance/:latlong/unit/:unit').get(tourController.getDistance);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getSingleTour)
  .patch(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// How express.Router() works: Whenever there is a request for '/api/v1/tours', it will call 'router' function. 'router' is a sub application that has its own routes, '/' & '/:id'. If there is a request for '/' or '/:id', it will run those route handlers

module.exports = router;
