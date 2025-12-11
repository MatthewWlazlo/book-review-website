const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const bookSchema = new Schema({
  book: {
    title: String,
    published: String,
    author: String,
    summary: String,
    reviews: [{
      name: String,
      email: String,
      rating: Number,
      review: String
    }],
  },
}, {
  timestamps: true
});

module.exports = model('Book', bookSchema);
