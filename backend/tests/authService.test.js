process.env.JWT_SECRET = 'testsecret';

jest.mock('../config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('bcryptjs');

const authService = require('../services/authService');
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Service - Login', () => {

  it('should login successfully', async () => {
    const mockUser = {
  userId: 1,
  username: 'Rama',
  email: 'rama@gmail.com',
  password: 'hashed',
  role: 'user'
};

    prisma.user.findUnique.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.login({
      email: 'rama@gmail.com',
      password: 'mnbvcxz'
    });

    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('rama@gmail.com');
  });

  it('should fail if password incorrect', async () => {
    prisma.user.findUnique.mockResolvedValue({
      PASSWORD: 'hashed'
    });

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: 'test@gmail.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });

});
describe('Auth Service - Register', () => {

  it('should register new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    prisma.user.create.mockResolvedValue({
      USER_ID: 1,
      USERNAME: 'Rama',
      EMAIL: 'rama@gmail.com',
      ROLE: 'user'
    });

    const result = await authService.register({
      username: 'Rama',
      email: 'rama@gmail.com',
      password: 'mnbvcxz'
    });

    expect(result).toHaveProperty('token');
    expect(result.user.EMAIL).toBe('rama@gmail.com');
  });

  it('should fail if user exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ EMAIL: 'rama@gmail.com' });

    await expect(
      authService.register({
        username: 'Rama',
        email: 'rama@gmail.com',
        password: 'mnbvcxz'
      })
    ).rejects.toThrow('User already exists');
  });

});