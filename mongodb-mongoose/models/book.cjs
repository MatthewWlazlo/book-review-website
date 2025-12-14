const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const bookSchema = new Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  published: String,
  author: String,
  summary: String,
  reviews: {
    type: [
      {
        name: String,
        email: String,
        rating: Number,
        review: String
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

module.exports = model('Book', bookSchema);
