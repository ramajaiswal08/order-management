jest.mock('../config/db', () => ({
  orderHeader: {
    findMany: jest.fn(),
    count: jest.fn()
  }
}));

const orderService = require('../services/orderService');
const prisma = require('../config/db');

describe('Order Service - Get User Orders', () => {

  it('should return orders list', async () => {
    prisma.orderHeader.count.mockResolvedValue(1);

    prisma.orderHeader.findMany.mockResolvedValue([
      {
        orderId: 1,
        orderStatus: 'DELIVERED',
        customer: { username: 'Rama' },
        shipper: {
          shipperName: 'Delhivery',
          shipperPhone: '9999999999'
        },
        orderItems: [
          {
            product: {
              productDesc: 'Laptop',
              productPrice: 50000
            }
          }
        ]
      }
    ]);

    const result = await orderService.getUserOrders(1);

    expect(result.orders.length).toBeGreaterThan(0);
   expect(result.orders[0].STATUS).toBe('DELIVERED');
expect(result.orders[0].USERNAME).toBe('Rama');
  });

  it('should return empty array if no orders', async () => {
    prisma.orderHeader.count.mockResolvedValue(0);
    prisma.orderHeader.findMany.mockResolvedValue([]);

    const result = await orderService.getUserOrders(1);

    expect(result.orders).toEqual([]);
    expect(result.total).toBe(0);
  });

});