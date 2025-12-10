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
    //match type in bookReview.js? 
    /*
        name: name,
        email: email,
        title: title,
        author: author,
        published: published,
        summary: summary,
        review: review
    */
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
const Book = model('Book', bookSchema);
export default Book;
