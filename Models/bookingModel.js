const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'A booking must have a tour!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A booking must have a user!']
  },
  price: {
    type: Number,
    required: [true, 'A booking must have a price!']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: '-guides'
  }).populate('user');
  next();

  // initially, the 'tour' field was also populated but I removed it. When I do query to check the bookings per single tour, the result was overwhelmed by the data from the populated tour field. And it was also redundant since I am querying for the a tour in the Tour model and another tour field is deeply nested in the JSON. 
});



const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;