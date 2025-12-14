const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const reviewSchema = new Schema({
  name: String,
  email: String,
  title: String,
  author: String,
  rating: Number,
  review: String,
}, {
  timestamps: true
});

module.exports = model('Review', reviewSchema);