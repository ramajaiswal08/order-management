const orderService = require('../services/orderService');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const ERRORS = require('../constants/errors');
const HttpStatus = require('../constants/httpStatus');

jest.mock('../config/db', () => ({
  product: {
    updateMany: jest.fn(),
    findUnique: jest.fn()
  }
}));

describe('Order Service - updateStock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should decrement stock when sufficient quantity is available', async () => {
    const tx = prisma;
    tx.product.updateMany.mockResolvedValue({ count: 1 });

    const items = [{ productId: 1, quantity: 5 }];
    await orderService.updateStock(tx, items);

    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: {
        productId: 1,
        productQuantityAvail: { gte: 5 }
      },
      data: {
        productQuantityAvail: { decrement: 5 }
      }
    });
  });

  it('should throw INSUFFICIENT_STOCK error when stock is insufficient', async () => {
    const tx = prisma;
    tx.product.updateMany.mockResolvedValue({ count: 0 });
    tx.product.findUnique.mockResolvedValue({ productId: 1, productQuantityAvail: 3 });

    const items = [{ productId: 1, quantity: 5 }];

    await expect(orderService.updateStock(tx, items))
      .rejects.toThrow(new AppError(ERRORS.INSUFFICIENT_STOCK, HttpStatus.BAD_REQUEST));
    
    expect(tx.product.findUnique).toHaveBeenCalledWith({
      where: { productId: 1 }
    });
  });

  it('should throw PRODUCT_NOT_FOUND error when product does not exist', async () => {
    const tx = prisma;
    tx.product.updateMany.mockResolvedValue({ count: 0 });
    tx.product.findUnique.mockResolvedValue(null);

    const items = [{ productId: 999, quantity: 1 }];

    await expect(orderService.updateStock(tx, items))
      .rejects.toThrow(new AppError(ERRORS.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND));
  });
});
