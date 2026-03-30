const express = require('express');
const router = express.Router(); 

const TransactionController = require('../controller/TransactionController');

router.post('/transactions', TransactionController.create);

router.get('/transactions/summary', TransactionController.getSummary);

router.get('/transactions', TransactionController.getAll);

router.put('/transactions/:id', TransactionController.update);

router.delete('/transactions/:id', TransactionController.delete);

module.exports = router;