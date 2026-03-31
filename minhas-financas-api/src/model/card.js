const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dueDay: {
    type: Number,
    required: true
  },
  closingDay: {
    type: Number,
    required: false
  },
  limit: {
    type: Number,
    default: 0
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Card', CardSchema);