const express = require('express');
const router = express.Router();
const shipperController = require('../controller/shipperController');
const authMiddleware    = require('../middleware/auth');
const adminOnly         = require('../middleware/adminOnly');

router.get('/',       authMiddleware,            shipperController.list);
router.post('/',      authMiddleware, adminOnly, shipperController.create);
router.patch('/:id',  authMiddleware, adminOnly, shipperController.update);
router.delete('/:id', authMiddleware, adminOnly, shipperController.delete);

module.exports = router;
