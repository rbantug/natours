/////////////////////////////////////////////
// Anything outside the Express Application
/////////////////////////////////////////////
const dotenv = require('dotenv');
const mongoose = require('./Models/tourModel');

process.on('uncaughtException', (err) => {
  console.log('Unhandled Exception. Shutting Down...')
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// the dotenv.config() should be placed before declaring the app variable

const DB = process.env.DATABASE.replace(
  'PASSWORD',
  process.env.DATABASE_PASSWORD
);

mongoose.mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB is working!'));

// After requiring mongoose, we will use mongoose.connect() and it accept 2 parameters. First is the string/link of the database. You'll find that in the mongodb atlas website or if using local mongodb, 'mongodb://localhost:27017/<dbname>'. Second is an object with stuff in it. You just need to copy and paste it since it's nothing that concerns you.

/*
const testTour = new Tour({
  name: 'Tour 6',
  rating: 7,
  price: 333,
});

testTour
  .save()
  .then((doc) => console.log(doc))
  .catch((err) => console.log('ERROR', err));
*/

// the 'testTour' is an instance of the 'Tour' model. The 'testTour' will have several methods, one of them is the '.save()' method. The save method will save the new instanced model to the database. It will also return a promise, which is why we are using a .then() method. We can also use async/await.

//const app = require('./app');

//console.log(app.get('env'));
// Express environment is 'development' on default. You can access it thru 'app.get('env')'
// environment variables are global variables that are used to define the environment in which a node app is running.
// 'env' was set by Express but NodeJS also have environments on its own

//console.log(process.env.NODE_ENV);
// nodeJS has it's own list of environment variables. You can access them thru 'process.env'. The list is almost the same when running 'env' in a linux terminal.
// process in 'process.env' does not require a module and it's available for us to access.

/*In Express, many packages depends on a special package called NODE_ENV. It's a variable that should define whether we are in development or in production. However, Express does not define this variable. So we must be the one to do that manually. 

Running 'console.log(process.env.NODE_ENV)' will print out 'undefined'

There are multiple ways to do that:

1. Thru the terminal
--- in the terminal, type in 'NODE_ENV=development nodemon server.js'

Running 'console.log(process.env.NODE_ENV)' will print out 'development'

2. Thru a config file
--- create a new file 'config.env'. In this file, you can specify the value of NODE_ENV as well as other variables you'd like to include like the PORT, USERNAME, PASSWORD or anything you'd need for testing or the whatever the purpose of the config file. 

--- install the npm package 'dotenv'
--- in the server.js file, you will require the dotenv module
--- using 'dotenv.config()', you will type in an object with the path of the config.env file.
--- run 'npm start' and those variables in the config file will be included in the process.env

*/

const port = process.env.PORT;

// we will use the port in the process.env.PORT

const server = app.listen(port, () => {
  console.log(`app is listening on port ${port}.`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection. Shutting Down...')
  server.close(() => {
    process.exit(1);
  });
});
