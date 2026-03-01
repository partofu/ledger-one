const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'test@packledger.in';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
    return;
  }

  console.log(`Found user: ${user.id}. Starting data removal...`);

  // Delete BillItems first (they reference Bills)
  const deletedBillItems = await prisma.billItem.deleteMany({
    where: {
      bill: {
        userId: user.id
      }
    }
  });
  console.log(`Deleted ${deletedBillItems.count} BillItems.`);

  // Delete Payments (reference User, Customer, and optionally Bill)
  const deletedPayments = await prisma.payment.deleteMany({
    where: { userId: user.id }
  });
  console.log(`Deleted ${deletedPayments.count} Payments.`);

  // Delete Bills (reference User and Customer)
  const deletedBills = await prisma.bill.deleteMany({
    where: { userId: user.id }
  });
  console.log(`Deleted ${deletedBills.count} Bills.`);

  // Delete Products (reference User)
  const deletedProducts = await prisma.product.deleteMany({
    where: { userId: user.id }
  });
  console.log(`Deleted ${deletedProducts.count} Products.`);

  // Delete Customers (reference User)
  const deletedCustomers = await prisma.customer.deleteMany({
    where: { userId: user.id }
  });
  console.log(`Deleted ${deletedCustomers.count} Customers.`);

  // Finally delete the User
  await prisma.user.delete({
    where: { id: user.id }
  });
  console.log(`Deleted User ${email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
