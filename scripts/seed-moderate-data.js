const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Starting clear and seed process...');

  // 1. Delete all records from specified tables (except User)
  const tablesToClear = [
    prisma.billItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.bill.deleteMany(),
    prisma.product.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.verificationSession.deleteMany()
  ];
  
  await prisma.$transaction(tablesToClear);
  console.log('Successfully cleared all non-user tables.');

  // 2. Fetch the two specific users
  const emails = [
    'tanishdpatel29112005@gmail.com',
    'tanishdpatel2005@gmail.com'
  ];

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: emails
      }
    }
  });

  if (users.length === 0) {
    console.log('No users found to seed data for.');
    return;
  }

  console.log(`Found ${users.length} users. Starting to seed data...`);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const now = new Date();

  // Helper arrays for generation
  const productNames = [
    ['Premium Packaging Tape', 'Bubble Wrap Roll 50m', 'Corrugated Box Small', 'Corrugated Box Medium', 'Corrugated Box Large', 'Stretch Film Roll', 'Shipping Labels 4x6', 'Packing Peanuts 1kg'],
    ['Office Paper A4 500 Sheets', 'Ballpoint Pens Box of 50', 'Sticky Notes 3x3', 'Stapler Heavy Duty', 'Paper Clips 1000pcs', 'Highlighters Set of 6', 'Whiteboard Markers 4pk', 'Desk Organizer']
  ];

  const customerNames = [
    ['Acme Corp Logistics', 'Global Shipping Ltd', 'FastTrack Deliveries', 'Metro Courier Service', 'Local Retailer Shop'],
    ['TechNova Solutions', 'EduCenter Academy', 'Greenfield Consultants', 'City Health Clinic', 'Downtown Law Firm']
  ];

  for (let u = 0; u < users.length; u++) {
    const user = users[u];
    console.log(`Seeding data for user: ${user.email} (${user.shopName})`);
    
    // Select name pool based on user index to differentiate a bit
    const pNames = productNames[u % productNames.length];
    const cNames = customerNames[u % customerNames.length];

    // --- CREATE PRODUCTS ---
    const createdProducts = [];
    for (let i = 0; i < 6; i++) {
        const price = Math.floor(Math.random() * 500) + 50; // 50 to 550
        const profit = price * (Math.floor(Math.random() * 20) + 10) / 100; // 10% to 30% profit
        createdProducts.push(
            await prisma.product.create({
                data: {
                    userId: user.id,
                    name: pNames[i],
                    stock: Math.floor(Math.random() * 200) + 50,
                    price: price,
                    profit: profit,
                    cgst: 9,
                    sgst: 9
                }
            })
        );
    }
    console.log(`  Created ${createdProducts.length} Products`);

    // --- CREATE CUSTOMERS ---
    const createdCustomers = [];
    for (let i = 0; i < cNames.length; i++) {
        createdCustomers.push(
            await prisma.customer.create({
                data: {
                    userId: user.id,
                    name: cNames[i],
                    phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
                    email: `contact@${cNames[i].toLowerCase().replace(/\s/g, '')}.com`,
                    type: Math.random() > 0.3 ? 'Bulk' : 'Retail',
                    createdAt: randomDate(threeMonthsAgo, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
                }
            })
        );
    }
    console.log(`  Created ${createdCustomers.length} Customers`);

    // --- CREATE BILLS & PAYMENTS ---
    // Generate ~15 bills per user over the last 3 months
    let billsCount = 0;
    let paymentsCount = 0;
    
    for (let i = 0; i < 15; i++) {
        const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
        
        // Items for this bill (1 to 4 items)
        const numItems = Math.floor(Math.random() * 4) + 1;
        const shuffledProducts = [...createdProducts].sort(() => 0.5 - Math.random());
        const selectedProducts = shuffledProducts.slice(0, numItems);
        
        const billItemsData = [];
        let totalSubTotal = 0;
        let totalCgstAmount = 0;
        let totalSgstAmount = 0;

        for (const product of selectedProducts) {
            const quantity = Math.floor(Math.random() * 10) + 1;
            const rate = product.price;
            const baseAmount = rate * quantity;
            const cgstAmount = baseAmount * (product.cgst / 100);
            const sgstAmount = baseAmount * (product.sgst / 100);
            const lineTotal = baseAmount + cgstAmount + sgstAmount;
            
            totalSubTotal += baseAmount;
            totalCgstAmount += cgstAmount;
            totalSgstAmount += sgstAmount;
            
            billItemsData.push({
                productId: product.id,
                productName: product.name,
                quantity: quantity,
                rate: rate,
                cgst: product.cgst,
                sgst: product.sgst,
                baseAmount: baseAmount,
                lineTotal: lineTotal
            });
        }
        
        const discount = Math.random() > 0.7 ? Math.floor(Math.random() * (totalSubTotal * 0.05)) : 0;
        const grandTotal = totalSubTotal + totalCgstAmount + totalSgstAmount - discount;
        
        // Status determination
        const isPaid = Math.random() > 0.4;
        const isPartial = !isPaid && Math.random() > 0.5;
        
        let paidAmount = 0;
        let dueAmount = grandTotal;
        let status = 'Unpaid';
        let paymentMode = null;
        
        if (isPaid) {
            paidAmount = grandTotal;
            dueAmount = 0;
            status = 'Paid';
            const modes = ['Cash', 'UPI', 'Bank'];
            paymentMode = modes[Math.floor(Math.random() * modes.length)];
        } else if (isPartial) {
            paidAmount = Math.floor(grandTotal * (0.3 + Math.random() * 0.5)); // 30-80% paid
            dueAmount = grandTotal - paidAmount;
            status = 'Partial';
            const modes = ['Cash', 'UPI', 'Bank'];
            paymentMode = modes[Math.floor(Math.random() * modes.length)];
        }
        
        const billDate = randomDate(threeMonthsAgo, now);
        const billNo = `INV-${billDate.getFullYear()}${String(billDate.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
        
        const bill = await prisma.bill.create({
            data: {
                userId: user.id,
                billNo: billNo,
                customerId: customer.id,
                customerName: customer.name,
                subTotal: totalSubTotal,
                totalCgst: totalCgstAmount,
                totalSgst: totalSgstAmount,
                discount: discount,
                total: grandTotal,
                paid: paidAmount,
                due: dueAmount,
                status: status,
                paymentMode: paymentMode,
                createdAt: billDate,
                updatedAt: billDate,
                items: {
                    create: billItemsData
                }
            }
        });
        billsCount++;
        
        // If there's a payment, create a Payment record
        if (paidAmount > 0 && paymentMode) {
             // Let's create a payment record corresponding to this bill
             await prisma.payment.create({
                 data: {
                     userId: user.id,
                     date: billDate,
                     customerId: customer.id,
                     billId: bill.id,
                     billNo: bill.billNo,
                     amount: paidAmount,
                     mode: paymentMode
                 }
             });
             paymentsCount++;
             
             // If it's a Partial bill, maybe they made another payment recently
             if (status === 'Partial' && Math.random() > 0.5) {
                 const recentDate = new Date(billDate.getTime() + (now.getTime() - billDate.getTime()) * Math.random());
                 const additionalPayment = Math.floor(dueAmount * (Math.random() * 0.8)); // pays up to 80% of remaining due
                 if (additionalPayment > 0) {
                     await prisma.payment.create({
                         data: {
                             userId: user.id,
                             date: recentDate,
                             customerId: customer.id,
                             billId: bill.id,
                             billNo: bill.billNo,
                             amount: additionalPayment,
                             mode: paymentMode
                         }
                     });
                     paymentsCount++;
                     
                     // Update bill due
                     await prisma.bill.update({
                         where: { id: bill.id },
                         data: {
                             paid: { increment: additionalPayment },
                             due: { decrement: additionalPayment },
                             updatedAt: recentDate
                         }
                     });
                 }
             }
        }
    }
    
    console.log(`  Created ${billsCount} Bills with related Items`);
    console.log(`  Created ${paymentsCount} Payments`);
  }

  console.log('Seed process completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
