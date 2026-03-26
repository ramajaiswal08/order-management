process.env.JWT_SECRET = 'testsecret';
const request = require('supertest');
const app = require('../app');

jest.mock('../config/db', () => ({
    user : {
        findunique:jest.fn()
    }
}));
jest.mock('bcryptjs');

const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

describe('Auth API - Login' , () => {
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
        email : 'rama@gmail.com',
        password: 'mnbvcxz'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    });
    
})


