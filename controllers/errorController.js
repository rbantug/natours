const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const message = `Duplicate field value: '${err.keyValue.name}'. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidatorErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};
// Object.values converts objects to arrays

const handleJWTInvalidSig = () =>
  new AppError('Invalid token. Please try again!', 401);

const handleExpiredToken = () =>
  new AppError('Expired token. Please try to login again', 401);

const sendErrorDev = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } /* else if (err.message === 'jwt expired') {
    // Rendered Website Error
    // For expired jwt. It will automatically delete the cookie.
    console.error(`This is a programming error`, err);
    res.clearCookie('jwt');
    res.status(err.statusCode).render('errorTemplate', {
      title: `Error ${err.statusCode}`,
      message: err.message,
    }); 
  } */ else {
    // Rendered Website Error
    console.error(`This is a programming error`, err);
    res.status(err.statusCode).render('errorTemplate', {
      title: `Error ${err.statusCode}`,
      message: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // API error
    if (err.isOperational) {
      // Operational, trusted error: we will send a message to the client
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming, unknown error: do not leak details to client
  
      // send a log
      console.error(`This is a programming error`, err);
  
      // Simple message to client
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  } else {
    // Rendered Website Error
      if (err.isOperational) {
        // Operational, trusted error: we will send a message to the client
        res.status(err.statusCode).render('errorTemplate', {
          title: 'Something went wrong',
          message: err.message,
        });
      } else {
        // Programming, unknown error: do not leak details to client
    
        // send a log
        console.error(`This is a programming error`, err);
    
        // Simple message to client
        res.status(500).render('errorTemplate', {
          title: 'Something went wrong',
          message: 'Please try again later',
        });
      }

  }
    
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //Internal Server Error
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    //let error = { ...err }; // This does not work. The error message is not showing up. 
    let error = Object.assign(err);

    // For handling invalid _id when searching, updating or deleting documents
    if (err.name === 'CastError') error = handleCastErrorDB(err);

    // For handling new documents with a duplicate field name
    if (err.code === 11000) error = handleDuplicateFieldDB(err);

    // For handling validator errors from schema
    if (err.name === 'ValidationError') error = handleValidatorErrorDB(err);

    // For handling JWT invalid signatures
    if (err.name === 'JsonWebTokenError') error = handleJWTInvalidSig();

    // For handling expired tokens
    if (err.name === 'TokenExpiredError') {
      //res.clearCookie('jwt');
      error = handleExpiredToken()
    };

    sendErrorProd(error, req, res);
  }
};

// In order to simulate an error, we will edit our route for unhandled routes and add a few stuff. 'new Error()' will create an error object. The string inside will be 'err.message'. Since it's an object, we can add 'err. status' & 'err.statusCode'.

// regarding 'next()', if next() accept an argument, express will know that it's an error. And what express will do is that it will skip ALL other middlewares and go directly to the error handling middleware.

// Please refer to appError.js in utils folder for the error class.

// We shouldn't leak too much info about the errors when we are in production. We should only sent messages that the client will understand

// regarding 'err.name' when handling errors, I can't find 'name' in the JSON object that mongoose sents to use in postman or in the console. But somehow it exist and I used that in the 'if' condition statement.

// Regarding generating error messages for when a validator error occurs, the JSON object mongoose sents us has a 'message' field with all the error messages in it. We can use that (err.message) as a quick solution to display the errors but we can't customize the message.

// 'req.originalUrl' is the URL without the host (127.0.0.1:8000). We need to check if client is accessing the API or the website so that we can specify what error we need to show them.
