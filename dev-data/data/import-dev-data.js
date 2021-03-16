// This files was created to import or delete JSON files into mongoBD + mongoose.

// If you're trying to import Jonas' 20 users, process.env.NODE_ENV should be 'LOADER' to skip the password encryption. All passwords in Jonas' 20 users are already encrypted.

const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../Models/tourModel');
const User = require('../../Models/userModel');
const Review = require('../../Models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  'PASSWORD',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB is working!'));

// Read JSON files

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// create new documents in the collection

const importData = async () => {
  try {
    await Tour.Tour.create(tours);
    await User.create(users, { validateBeforeSave: false 
    });
    await Review.create(reviews);
    console.log('import successful');
  } catch (err) {
    console.log(err);
  }
  process.exit(); // stops the script. We placed it outside the try/catch block so that it will run regardless if if worked or not.
};

// Delete all documents in the collection

const deleteData = async () => {
  try {
    await Tour.Tour.deleteMany(); // mongoose has access to deleteMany() from mongodb
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);

// process.argv returns an array based on the stuff you run in the terminal. Running 'node dev-data/data/import-dev-data.js' will return an an array containing 2 elements, which is filesystem location of 'node' & 'dev-data/data/import-dev-data.js'. If you 

// Running 'node dev-data/data/import-dev-data.js --import' will return 3 elements, the 3rd element being '--import'. We can use this to make our script recognize what function we want to run.
