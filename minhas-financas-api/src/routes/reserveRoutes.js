const express = require('express');
const router = express.Router();
const ReserveController = require('../controller/ReserveController');

router.post('/reserves', ReserveController.create);
router.get('/reserves', ReserveController.getAll);
router.get('/reserves/summary', ReserveController.getSummary);
router.delete('/reserves/:id', ReserveController.delete);

module.exports = router;
