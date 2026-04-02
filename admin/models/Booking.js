const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new Schema({
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
  screening: { type: Schema.Types.ObjectId, ref: 'Screening', required: true },
  seats: [{ type: String }],
  totalAmount: { type: Number, required: true, min: 0 },
  // sparse: true so multiple docs with no ref don't collide on the unique index
  bookingRef: { type: String, unique: true, sparse: true }
}, { timestamps: true });

bookingSchema.pre('save', function () {
  if (!this.bookingRef) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let ref = 'CV-';
    for (let i = 0; i < 6; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bookingRef = ref;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
