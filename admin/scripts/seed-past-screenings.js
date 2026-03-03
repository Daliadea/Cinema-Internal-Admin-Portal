/**
 * One-off script: add past screenings to the database for demo/video.
 * Run from project root: node admin/scripts/seed-past-screenings.js
 * (or from admin folder: node scripts/seed-past-screenings.js)
 */
const mongoose = require('mongoose');
const path = require('path');

// Load models (script may be run from repo root or from admin/)
const modelsPath = path.join(__dirname, '..', 'models');
const Movie = require(path.join(modelsPath, 'Movie'));
const Hall = require(path.join(modelsPath, 'Hall'));
const Screening = require(path.join(modelsPath, 'Screening'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinema_admin';

async function seedPastScreenings() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const movies = await Movie.find().limit(5).lean();
  const halls = await Hall.find().limit(5).lean();

  if (movies.length === 0 || halls.length === 0) {
    console.log('Need at least one movie and one hall. Add movies and halls first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  const pastScreenings = [
    { dayOffset: 7, hour: 14, minute: 0 },   // 1 week ago, 2:00 PM
    { dayOffset: 6, hour: 19, minute: 30 }, // 6 days ago, 7:30 PM
    { dayOffset: 5, hour: 12, minute: 0 }, // 5 days ago, noon
    { dayOffset: 4, hour: 18, minute: 0 },  // 4 days ago, 6:00 PM
    { dayOffset: 3, hour: 10, minute: 30 }, // 3 days ago, 10:30 AM
  ];

  let created = 0;
  for (let i = 0; i < pastScreenings.length; i++) {
    const { dayOffset, hour, minute } = pastScreenings[i];
    const movie = movies[i % movies.length];
    const hall = halls[i % halls.length];
    const startTime = new Date(now.getTime() - dayOffset * oneDay);
    startTime.setHours(hour, minute, 0, 0);
    const durationMins = movie.duration || 120;
    const endTime = new Date(startTime.getTime() + (durationMins + 15) * 60 * 1000);

    const existing = await Screening.findOne({
      hall: hall._id,
      startTime: { $gte: new Date(startTime.getTime() - 60000), $lte: new Date(startTime.getTime() + 60000) },
    });
    if (existing) continue;

    await Screening.create({
      movie: movie._id,
      hall: hall._id,
      startTime,
      endTime,
    });
    created++;
    console.log(`  Added past screening: ${movie.title} in ${hall.name} at ${startTime.toLocaleString()}`);
  }

  console.log(`Done. Created ${created} past screening(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

seedPastScreenings().catch((err) => {
  console.error(err);
  process.exit(1);
});
