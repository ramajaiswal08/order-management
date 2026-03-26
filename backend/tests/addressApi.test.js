jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});

jest.mock('../config/db', () => ({
  address: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn()
  },
  $transaction: jest.fn((cb) =>
    cb({
      address: {
        updateMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ addressId: 101 })
      }
    })
  )
}));

const request = require('supertest');
const app = require('../app');

describe('Address API - Add', () => {

  it('should add address', async () => {

    const token = 'dummy_token'; // if auth middleware exists

    const res = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        line1: 'Street 1',
        city: 'Raipur',
        pincode: 492001
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

});