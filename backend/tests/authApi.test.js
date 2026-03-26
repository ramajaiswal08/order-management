process.env.JWT_SECRET = 'testsecret';

jest.mock('../config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');


describe('Auth API - Login', () => {

  it('should login successfully', async () => {

    prisma.user.findUnique.mockResolvedValue({
      userId: 1,
      username: 'Rama',
      email: 'rama@gmail.com',
      password: 'hashed',
      role: 'user'
    });

    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rama@gmail.com',
        password: 'mnbvcxz'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

});


describe('Auth API - Register', () => {

  it('should register successfully', async () => {

    prisma.user.findUnique.mockResolvedValue(null);

    bcrypt.hash.mockResolvedValue('hashed');

    prisma.user.create.mockResolvedValue({
      userId: 1,
      username: 'Rama',
      email: 'rama@gmail.com',
      role: 'user'
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'Rama',
        email: 'rama@gmail.com',
        password: 'mnbvcxz'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

});