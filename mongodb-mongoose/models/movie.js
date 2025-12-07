/*
schema that represents a movie
-title
-author
-published
-summary
-reviews
*/
import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const movieSchema = new Schema({
  title: String,
  published: String,
  author: String,
  summary: String,
  reviews: [String],
  comments: [{
    user: String,
    content: String,
  }]
}, {
  timestamps: true
});
const Movie = model('Movie', movieSchema);
export default Movie;
