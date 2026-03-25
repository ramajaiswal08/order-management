const express = require('express');
const router = express.Router();
const addressController = require('../controller/addressController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, addressController.list);
router.post('/', authMiddleware, addressController.add);
router.delete('/:id', authMiddleware, addressController.remove);

module.exports = router;
