const mongoose = require('mongoose');

const reserveSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['guardado', 'investido'], required: true },
  date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Reserve', reserveSchema);
