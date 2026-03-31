require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const transactionRoutes = require('./routes/transactionRoutes');
const cardRoutes = require('./routes/cardRoutes');
const reserveRoutes = require('./routes/reserveRoutes');
const accountRoutes = require('./routes/accountRoutes');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌ Error connecting to MongoDB:', err));

app.use('/api', transactionRoutes);
app.use('/api', cardRoutes);
app.use('/api', reserveRoutes);
app.use('/api', accountRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});