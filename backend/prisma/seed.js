const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Product Classes
  const categories = [
    { code: 1, productClassDesc: 'Electronics' },
    { code: 2, productClassDesc: 'Clothing' },
    { code: 3, productClassDesc: 'Home & Garden' },
  ];

  for (const cat of categories) {
    await prisma.productClass.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  // 2. Create Products
  const products = [
    {
      productId: 101,
      productDesc: 'Smartphone Alpha',
      productClassCode: 1,
      productPrice: 699.99,
      productQuantityAvail: 50,
    },
    {
      productId: 102,
      productDesc: 'Wireless Headphones',
      productClassCode: 1,
      productPrice: 149.99,
      productQuantityAvail: 100,
    },
    {
      productId: 103,
      productDesc: 'Classic Cotton T-Shirt',
      productClassCode: 2,
      productPrice: 19.99,
      productQuantityAvail: 200,
    },
    {
      productId: 104,
      productDesc: 'Ceramic Coffee Mug',
      productClassCode: 3,
      productPrice: 12.50,
      productQuantityAvail: 300,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { productId: p.productId },
      update: {},
      create: p,
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
