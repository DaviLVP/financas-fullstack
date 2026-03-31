const express = require('express');
const router = express.Router(); 

const CardController = require('../controller/CardController');

router.get('/cards/faturas', CardController.getFaturas);
router.post('/cards', CardController.create);
router.get('/cards', CardController.getAll);
router.put('/cards/:id', CardController.update);
router.delete('/cards/:id', CardController.remove);

module.exports = router;