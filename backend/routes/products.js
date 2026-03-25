const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');

router.get('/', productController.getAll);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getById);

module.exports = router;
