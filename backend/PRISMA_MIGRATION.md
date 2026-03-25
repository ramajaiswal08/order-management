# Database Migration to Prisma ORM

## Overview
This project has been migrated from raw MySQL queries to Prisma ORM for better type safety, query building, and database management.

## Changes Made

### 1. Database Schema (Prisma)
- **Fixed schema issues:**
  - Proper AUTO_INCREMENT for primary keys
  - Correct ENUM types for user roles
  - Proper DECIMAL types for prices
  - Fixed foreign key relationships
  - Added proper indexes for frequently queried fields

- **Added indexes for performance:**
  - `User.customerId` - for user-related queries
  - `Product.productClassCode` - for category filtering
  - `Product.productDesc` - for search queries
  - `OrderHeader.customerId` - for user order queries
  - `OrderHeader.orderStatus` - for status filtering
  - `OrderHeader.orderDate` - for date-based sorting
  - `Address.customerId` - for user address queries
  - `Address.isDefault` - for default address queries
  - `Shipper.shipperName` - for shipper search

### 2. ORM Implementation
- **Replaced mysql2 with @prisma/client**
- **All services updated to use Prisma queries instead of raw SQL**
- **Proper type safety and IntelliSense support**
- **Transaction support for complex operations**

### 3. No SELECT * Queries
- **All queries specify exact fields needed**
- **Optimized data fetching with select/include**
- **Reduced memory usage and improved performance**

### 4. Environment Configuration
- **Added DATABASE_URL for Prisma**
- **Maintained backward compatibility with existing env vars**

## Database Models

### User
- id, username, email, password, role, createdAt
- Relations: addresses, orders

### Product
- id, description, classCode, price, stock, dimensions, weight
- Relations: productClass, orderItems

### ProductClass
- code, description
- Relations: products

### OrderHeader
- id, customerId, dates, status, payment info, shipper, address
- Relations: customer, shipper, shippingAddress, orderItems

### OrderItem
- orderId, productId, quantity
- Relations: order, product

### Address
- id, customerId, details, isDefault
- Relations: customer, orders

### Shipper
- id, name, phone, address
- Relations: orders

## Migration Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Create and run migrations (for production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Benefits

1. **Type Safety**: Full TypeScript-like type checking
2. **Better Performance**: Optimized queries with proper indexing
3. **Maintainability**: Declarative schema definition
4. **Security**: No SQL injection vulnerabilities
5. **Developer Experience**: Auto-completion and schema validation
6. **Migrations**: Version-controlled database changes

## Environment Variables

Add to your `.env` file:
```
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

## Usage Examples

```javascript
// Find user with addresses
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { addresses: true }
});

// Create order with transaction
const order = await prisma.$transaction(async (tx) => {
  const order = await tx.orderHeader.create({ data: { ... } });
  await tx.orderItem.createMany({ data: items });
  return order;
});
```