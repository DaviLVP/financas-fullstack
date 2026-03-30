const express = require('express');
const router = express.Router(); 

const CardController = require('../controller/CardController');

router.post('/cards', CardController.create);
router.get('/cards', CardController.getAll);
router.put('/cards/:id', CardController.update);

module.exports = router;