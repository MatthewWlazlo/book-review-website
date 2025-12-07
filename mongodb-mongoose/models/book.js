/*
schema that represents a a book
-title
-author
-published
-summary
-reviews
*/
import mongoose from 'mongoose';
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
      review: String
    }],
  },
  }, {
  timestamps: true
});
const Book = model('Book', bookSchema);
export default Book;
