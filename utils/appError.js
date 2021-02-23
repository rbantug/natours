class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = 'true';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

// In ES6, we can use an existing object or another class to work with a new class by using 'extends...super'. 'extends Error' is the 'new Error()' found at the route for unhandled routes in app.js. 'super(message)' is the string we pass thru 'new Error()'. We also need to specify if the error is an operational error, which is why we'll add 'this.isOperational = true'. We will use this later when we add a functionality that will send a response to clients to let them know that it's not our fault why the app is not working.

// we did not add 'this.message = super.message' because we can already call that message thru 'err.message'

// the purpose of the 'Error.captureStackTrace' is to prevent the constructor method from appearing in the stack trace. The stack trace are messages that consist of function calls that will show you where the error in your code is. The first line in the stack trace is usually the location of the line of code that has a faulty code.
