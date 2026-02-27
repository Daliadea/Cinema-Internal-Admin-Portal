const mongoose = require('mongoose');
const { Schema } = mongoose;

const hallSchema = new Schema({
    name: {type: String, required: true},
    rows: {type: Number, required: true},
    columns: {type: Number, required: true},
    wheelchairSeats: [{type: String}], //array of string possible types
    isUnderMaintenance: {type: Boolean, default: false}
},{timestamps: true});

module.exports = mongoose.model("Hall", hallSchema);