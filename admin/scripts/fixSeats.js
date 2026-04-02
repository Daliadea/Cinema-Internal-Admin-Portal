const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/cinema_admin').then(async () => {
  const bookingsColl = mongoose.connection.collection('bookings');
  const screeningsColl = mongoose.connection.collection('screenings');

  // Remove any booking records that were saved without a bookingRef (orphaned by the bug)
  const badBookings = await bookingsColl.deleteMany({ bookingRef: { $in: [null, '', undefined] } });
  console.log('Removed orphaned booking records:', badBookings.deletedCount);

  // For each screening, check that every seat in bookedSeats has a corresponding Booking document
  const screenings = await screeningsColl.find({ bookedSeats: { $exists: true, $ne: [] } }).toArray();
  let totalReleased = 0;

  for (const s of screenings) {
    const bookings = await bookingsColl.find({ screening: s._id }).toArray();
    const legitimateSeats = bookings.flatMap(b => b.seats || []);
    const orphaned = (s.bookedSeats || []).filter(seat => !legitimateSeats.includes(seat));

    if (orphaned.length > 0) {
      await screeningsColl.updateOne(
        { _id: s._id },
        { $pull: { bookedSeats: { $in: orphaned } } }
      );
      console.log(`Released ${orphaned.length} orphaned seat(s) from screening ${s._id}:`, orphaned.join(', '));
      totalReleased += orphaned.length;
    }
  }

  console.log(`Total seats released: ${totalReleased}`);
  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
