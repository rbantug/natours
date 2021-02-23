const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name is required'],
      unique: true, // Can't have documents with the same name
      trim: true,
      minlength: [10, 'The name should be more or equal 10 characters'],
      maxlength: [40, 'The name should be less or equal 40 characters'],
      validate: {
        validator: function (val) {
          const newString = val.split(' ').join('');
          return validator.isAlpha(newString);
        },
        message: 'The tour name can only accept characters',
      },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Tour duration is required'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour must have a difficulty'],
      enum: {
        values: ['Easy', 'easy', 'medium', 'Medium', 'difficult', 'Difficult'],
        message: 'A tour can be easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.3,
      min: [1, 'The rating should be more or equal to 1'],
      max: [5, 'The rating should be less or equal to 5'],
      set: (val) => val.tofixed(1), // everytime there is a new value, this funciton will run
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A price is required'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message:
          'The price discount ({VALUE}) must be less than the price itself',
      },
    },
    summary: {
      type: String,
      trim: true, // A type option that removes all whitespaces before and after the string
      required: [true, 'a tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have a cover image'],
    },
    images: [String], // data type is an array of strings
    createdAt: {
      type: Date,
      default: Date.now(), // mongoose will change this from milliseconds to the current date & time
    },
    startDates: [Date], // An array of dates. startDates will contain the start dates for a single tour
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point', 'point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point', 'point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, -- for connecting different datasets using embedding.

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Mongoose uses javascript standard data types. Regarding the Schema datatype, you can declare them as a key value pair (ex: 'name: String') or using an object with the type property (ex: 'name: {type: String}'). In addition to the 'type' property, there are other properties like 'required', 'default' or 'unique'. These properties are known as Schema type options.

// In the 'required' property, you can specify an error string if no data was added to the field. You can do that by using an array with the first element as the boolean and the second element as the error string. Required property also works as an validator in this case since it checks if the name/price is actually there.

// The 'select' property accepts a boolean value. If set to false, the field will not be included in queries.

///////////////////////////////////
// Indexes
///////////////////////////////////

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

///////////////////////////////////
// Virtual Properties
///////////////////////////////////

// Virtual properties are properties that you can get(ter) or set(ter) but does not persist in MongoDB. Getters can let you do complicated computations or concat strings on the data from your collection. Setters can let you deconstruct data into several variables for storage. We can't use virtual properties when querying because these properties does not exist in MongoDB.

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// in the example above, we need a new field 'durationWeeks' to get the number of weeks of each tour. Please note that we used a function declaration and not an arrow function (function expression) so that we have access to 'this'. 'this' refers to the tourSchema.

//////////////////////////////////////
// Virtual Populate
//////////////////////////////////////

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//////////////////////////////////////
// Document Middleware
//////////////////////////////////////

// Middlewares can run before a specific function '.pre()' or after a specific function '.post()'.

// Document middlewares will run before or after '.save()' or '.create()'. In document middleware functions, 'this' refers to the document.

// the callback function inside .pre will return a promise. You can use async/await. You can also just use next() since it's a middleware.

// Regarding terminology, a 'Schema.pre('save', n function(){})' is called a 'pre save hook'. When using .post(), we'll call it 'post save hook'. We can do multiple pre save hooks and post save hooks.

// Post middlewares will run after all pre middlewares are done and the document was added to the database. The post hook function can accept 2 parameters, doc & next. 'doc' is the saved document in the database.

// slugify module removes symbols from this.name. it can also turn strings into lowercase.

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Testing middleware');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//////////////////////////////////////////////
// Connecting documents from 2 different collections using embedding
//////////////////////////////////////////////

/* tourSchema.pre('save', async function (next){
  this.guides = await User.find({ _id: { $in: this.guides } });
  next();
}); */

// a simpler solution that uses 'find()' and queries for the '_id' to include documents that matches those IDs found in 'this.guides'. It's a much faster code since it does not need to pass thru map() and Promise.all()

/* tourSchema.pre('save', async function (next) {
  const guidePromises = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidePromises);
  next();
}) */

// So how this works is that we want to get the user from user collection thru it's ID. We will do a 'findById()' and it will return a promise. Since 'this.guides' is an array of user IDs, guidePromises will be an array of Promises...

// To resolve all that promises in guidePromises, we will use 'Promise.all()' method

// The Promise.all() method takes an iterable of promises as an input, and returns a single Promise that resolves to an array of the results of the input promises. This method is async method so...we need to do another async/await in the scope of Promise.all()

////////////////////////////////////
// Connecting documents from 2 different collections using referencing
////////////////////////////////////

// We will use a query middleware with the '.populate()' method so that all 'find' queries will have the populate method.

// Thought this is a post-query hook but it doesn't work with post.

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

////////////////////////////////////
// Query Middleware
////////////////////////////////////

// Query middleware is the same with document middleware. 'this' refers to the query, not the document.
// The purpose of the code below is to show a secret tour whenever someone will use the right query

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log(
    `This query took ${Date.now() - this.start} milliseconds to finish.`
  );
  next();
});

// 'this.find()' can be other queries. The purpose of the code is to exclude all documents with 'secretTour: true'.

// The pre find hook middleware works by running the '.find()' method on the 'this', which is the query from req.query. This middleware will run before the getAllTours() Route.

// We have to remember that this pre find hook will only work for .find() and not for the other find queries. One way to resolve this issue is to add an array of all the queries we would want this middleware to run on. --> ['find', 'findOne', ...]

// A better solution is to use regex --> /^find/ --> when we request any query that starts with 'find', this middleware will surely run.

// Query middleware .post() has the same parameters with the document middleware. 'Doc' has access to the results of the query.

//////////////////////////////////////
// Aggregation Middleware
//////////////////////////////////////

// Use case is when we forgot to add a stage that will filter or do other stuff in our document. While we can add them manually in each collection.aggregate() in our code, another way that we can do is thru a pre aggregate hook.

// the 'this' in a aggregate middleware is the aggregate object. We need to access the aggregate pipeline, which is an array, and add a new object at the start of that array. The code is this.pipeline().unshift()

tourSchema.pre('aggregate', function (next) {
  if (!('$geoNear' in this.pipeline()[0])) {
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } },
    });
  }
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

// The model name 'Tour', both the variable and the one inside the model method, are capitalized because it is a common naming convention in programming to use uppercase on model name and variables.

// for the syntax and other matters, check the documentation: https://mongoosejs.com/docs/models.html

// we will export 'Tour'

exports.mongoose = mongoose;
exports.Tour = Tour;
