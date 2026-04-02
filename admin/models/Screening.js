const mongoose = require('mongoose');
const { Schema } = mongoose;

const screeningSchema = new Schema({
  movie: { 
    type: Schema.Types.ObjectId, 
    ref: 'Movie', 
    required: true 
  },
  hall: { 
    type: Schema.Types.ObjectId, 
    ref: 'Hall', 
    required: true 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  price: { type: Number, default: 12.00, min: 0 },
  bookedSeats: [{ type: String }]
}, { timestamps: true }); 

module.exports = mongoose.model('Screening', screeningSchema);