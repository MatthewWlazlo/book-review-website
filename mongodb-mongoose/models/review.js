import mongoose from 'mongoose';
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
const Review = model('review', reviewSchema);
export default Review;