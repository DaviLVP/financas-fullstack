const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  
  amount: { type: Number, required: true }, 
  
  type: { type: String, enum: ['income', 'expense'], required: true },

  date: { type: Date, required: true }, 

  cardId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Card', 
    required: false 
  },

  installmentInfo: { 
    type: String, 
    required: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);