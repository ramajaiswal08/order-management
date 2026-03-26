// tests/productApi.test.js

jest.mock('../config/db', () => ({
  product: {
    findMany: jest.fn(),
    count: jest.fn()
  }
}));

const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Product API - Get All', () => {

  it('should return products', async () => {

    prisma.product.count.mockResolvedValue(1);

    prisma.product.findMany.mockResolvedValue([
      {
        productId: 1,
        productDesc: 'Laptop'
      }
    ]);

    const res = await request(app)
      .get('/api/v1/products');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

});