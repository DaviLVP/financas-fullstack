const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  initialBalance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Account', AccountSchema);
