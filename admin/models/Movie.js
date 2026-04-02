const mongoose = require('mongoose');
const { Schema } = mongoose;

const movieSchema = new Schema({
  title: { type: String, required: true },
  duration: { type: Number, required: true, min: [1, 'Duration must be at least 1 minute'], max: [600, 'Duration cannot exceed 600 minutes'] },
  description: String,
  genre: String,
  isActive: { type: Boolean, default: true },
  rating: { type: Number, required: true, min: [0, 'Rating must be between 0 and 10'], max: [10, 'Rating must be between 0 and 10'] },
  status: { type: String, enum: ['now_showing', 'coming_soon'], default: 'now_showing' },
  posterUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);