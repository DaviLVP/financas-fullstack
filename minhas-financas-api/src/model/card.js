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
  limit: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Card', CardSchema);