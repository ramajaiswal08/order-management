jest.mock('../config/db', () => ({
  product: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  productClass: {
    findMany: jest.fn()
  }
}));

const productService = require('../services/productService');
const prisma = require('../config/db');

describe('Product Service - getAll', () => {

  it('should return product list', async () => {
    prisma.product.count.mockResolvedValue(1);

    prisma.product.findMany.mockResolvedValue([
      {
        productId: 1,
        productDesc: 'Laptop',
        productClassCode: 10,
        productPrice: 50000,
        productQuantityAvail: 5,
        productClass: {
          productClassDesc: 'Electronics'
        }
      }
    ]);

    const result = await productService.getAll({});

    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products[0].PRODUCT_DESC).toBe('Laptop');
    expect(result.total).toBe(1);
  });

});

describe('Product Service - getById', () => {

  it('should return product details', async () => {
    prisma.product.findUnique.mockResolvedValue({
      productId: 1,
      productDesc: 'Laptop',
      productClassCode: 10,
      productPrice: 50000,
      productQuantityAvail: 5,
      productClass: {
        productClassDesc: 'Electronics'
      }
    });

    const result = await productService.getById(1);

    expect(result.PRODUCT_ID).toBe(1);
    expect(result.PRODUCT_DESC).toBe('Laptop');
  });

  it('should throw error if product not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      productService.getById(999)
    ).rejects.toThrow('Product not found');
  });

});

describe('Product Service - getCategories', () => {

  it('should return categories list', async () => {
    prisma.productClass.findMany.mockResolvedValue([
      {
        code: 10,
        productClassDesc: 'Electronics',
        _count: {
          products: 5
        }
      }
    ]);

    const result = await productService.getCategories();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].PRODUCT_CLASS_DESC).toBe('Electronics');
    expect(result[0].count).toBe(5);
  });

});