const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const reviewSchema = new Schema({
  review: {
    user: String,
    email: String,
    rating: Number,
    reviews: String
  },
  }, {
  timestamps: true
});

module.exports = model('Review', reviewSchema);