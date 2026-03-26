jest.mock('../config/db', () => ({
  address: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback({
    address: {
      updateMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ addressId: 101 })
    }
  }))
}));

const prisma = require('../config/db');
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
  it('should soft delete address', async () => {
  prisma.address.findFirst.mockResolvedValue({ addressId: 1 });
  prisma.address.update.mockResolvedValue({});

  await addressService.remove(1, 1);

  expect(prisma.address.update).toHaveBeenCalledWith({
    where: { addressId: 1 },
    data: { isDeleted: true }
  });
});

});