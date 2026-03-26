jest.mock('../config/db', () => ({
  address: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback({
    address: {
      updateMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ addressId: 101 })
    }
  }))
}));

const addressService = require('../services/addressService');

describe('Address Service - Add', () => {

  it('should add address successfully', async () => {
    const result = await addressService.add(1, {
      label: 'Home',
      line1: 'Street 1',
      city: 'Raipur',
      state: 'CG',
      pincode: '492001',
      isDefault: true
    });

    expect(result).toBe(101);
  });

});