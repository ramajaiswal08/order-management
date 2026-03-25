const express = require('express');
const router = express.Router();
const shipperController = require('../controller/shipperController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', shipperController.list);
router.post('/', shipperController.create);
router.patch('/:id', shipperController.update);
router.delete('/:id', shipperController.delete);

module.exports = router;
