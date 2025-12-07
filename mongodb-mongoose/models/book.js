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
  name: String,
  email: String,
  title: String,
  published: String,
  author: String,
  summary: String,
  reviews: [String],
}, {
  timestamps: true
});
const Book = model('Book', bookSchema);
export default Book;
