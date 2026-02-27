const mongoose = require('mongoose');
const { Schema } = mongoose;

const movieSchema = new Schema({
  title: { type: String, required: true },
  duration: { type: Number, required: true }, // for overlap logic
  description: String,
  genre: String,
  isActive: { type: Boolean, default: true },
  rating: { type: Number, required: true },
}, { timestamps: true }); // Automatically handles createdAt/updatedAt

module.exports = mongoose.model('Movie', movieSchema);