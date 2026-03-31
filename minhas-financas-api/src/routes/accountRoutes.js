const express = require('express');
const router = express.Router();
const AccountController = require('../controller/AccountController');

router.get('/accounts', AccountController.getAll);
router.post('/accounts', AccountController.create);
router.put('/accounts/:id', AccountController.update);
router.delete('/accounts/:id', AccountController.remove);

module.exports = router;
