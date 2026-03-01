const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Test User ──────────────────────────────────────
  const hashedPassword = await bcrypt.hash("test123", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@packledger.in" },
    update: {},
    create: {
      shopName: "Tanish Packaging Co.",
      email: "test@packledger.in",
      phone: "9876543210",
      password: hashedPassword,
      otp: null,        // verified
      otpExpiresAt: null,
      otpType: null,
    },
  });
  console.log(`  ✅ User: ${user.email} (password: test123)`);

  // ── 2. Customers ──────────────────────────────────────
  const customerData = [
    { name: "Rajesh Sharma",     phone: "9001001001", email: "rajesh@gmail.com",    type: "Bulk" },
    { name: "Priya Enterprises", phone: "9001001002", email: "priya@outlook.com",   type: "Bulk" },
    { name: "Mohan Plastics",    phone: "9001001003", email: "mohan@yahoo.com",     type: "Retail" },
    { name: "Neha Traders",      phone: "9001001004", email: "neha@gmail.com",      type: "Retail" },
    { name: "Vikram Packaging",  phone: "9001001005", email: "vikram@gmail.com",    type: "Bulk" },
    { name: "Amit Supplies",     phone: "9001001006", email: "amit@hotmail.com",    type: "Retail" },
    { name: "Sunita Paper Mills", phone: "9001001007", email: "sunita@gmail.com",   type: "Bulk" },
    { name: "Kiran Box House",   phone: "9001001008", email: "kiran@gmail.com",     type: "Retail" },
  ];

  const customers = [];
  for (const c of customerData) {
    const customer = await prisma.customer.create({
      data: { userId: user.id, ...c },
    });
    customers.push(customer);
  }
  console.log(`  ✅ Customers: ${customers.length} created`);

  // ── 3. Products ───────────────────────────────────────
  const productData = [
    { name: "Corrugated Box 12x10x8",  stock: 500,  price: 45.00,   profit: 12.00, cgst: 9, sgst: 9 },
    { name: "Corrugated Box 18x14x12", stock: 300,  price: 75.00,   profit: 18.00, cgst: 9, sgst: 9 },
    { name: "Bubble Wrap Roll 50m",    stock: 120,  price: 320.00,  profit: 65.00, cgst: 9, sgst: 9 },
    { name: "Stretch Film 500mm",      stock: 80,   price: 280.00,  profit: 55.00, cgst: 9, sgst: 9 },
    { name: "Packing Tape Brown 2\"",  stock: 1000, price: 35.00,   profit: 10.00, cgst: 9, sgst: 9 },
    { name: "Thermocol Sheet 1x1m",    stock: 200,  price: 60.00,   profit: 15.00, cgst: 9, sgst: 9 },
    { name: "Air Pillow Pack (100pc)", stock: 50,   price: 450.00,  profit: 90.00, cgst: 9, sgst: 9 },
    { name: "Kraft Paper Roll 10kg",   stock: 75,   price: 520.00,  profit: 100.00, cgst: 9, sgst: 9 },
    { name: "PP Strap Roll 15mm",      stock: 150,  price: 180.00,  profit: 40.00, cgst: 9, sgst: 9 },
    { name: "Edge Protector L-shape",  stock: 400,  price: 25.00,   profit: 8.00,  cgst: 9, sgst: 9 },
  ];

  const products = [];
  for (const p of productData) {
    const product = await prisma.product.create({
      data: { userId: user.id, ...p },
    });
    products.push(product);
  }
  console.log(`  ✅ Products: ${products.length} created`);

  // ── 4. Bills + BillItems + Payments ───────────────────
  // Helper: random items for a bill
  function makeBillItems(productPool, count) {
    const selected = productPool.sort(() => 0.5 - Math.random()).slice(0, count);
    return selected.map((p) => {
      const qty = Math.floor(Math.random() * 20) + 1;
      const rate = p.price;
      const baseAmount = qty * rate;
      const cgstAmt = +(baseAmount * p.cgst / 100).toFixed(2);
      const sgstAmt = +(baseAmount * p.sgst / 100).toFixed(2);
      const lineTotal = +(baseAmount + cgstAmt + sgstAmt).toFixed(2);
      return {
        productId: p.id,
        productName: p.name,
        quantity: qty,
        rate,
        cgst: cgstAmt,
        sgst: sgstAmt,
        baseAmount,
        lineTotal,
      };
    });
  }

  const billConfigs = [
    // Paid bills
    { custIdx: 0, billNo: "PL-2026-001", status: "Paid",    paidFrac: 1.0,  discount: 50,   itemCount: 3, daysAgo: 45, mode: "UPI" },
    { custIdx: 1, billNo: "PL-2026-002", status: "Paid",    paidFrac: 1.0,  discount: 0,    itemCount: 4, daysAgo: 40, mode: "Bank" },
    { custIdx: 2, billNo: "PL-2026-003", status: "Paid",    paidFrac: 1.0,  discount: 100,  itemCount: 2, daysAgo: 38, mode: "Cash" },
    { custIdx: 3, billNo: "PL-2026-004", status: "Paid",    paidFrac: 1.0,  discount: 0,    itemCount: 3, daysAgo: 35, mode: "UPI" },
    { custIdx: 4, billNo: "PL-2026-005", status: "Paid",    paidFrac: 1.0,  discount: 200,  itemCount: 5, daysAgo: 30, mode: "Bank" },
    // Partial bills
    { custIdx: 0, billNo: "PL-2026-006", status: "Partial", paidFrac: 0.6,  discount: 0,    itemCount: 3, daysAgo: 25, mode: "Cash" },
    { custIdx: 5, billNo: "PL-2026-007", status: "Partial", paidFrac: 0.4,  discount: 50,   itemCount: 2, daysAgo: 20, mode: "UPI" },
    { custIdx: 6, billNo: "PL-2026-008", status: "Partial", paidFrac: 0.75, discount: 0,    itemCount: 4, daysAgo: 15, mode: "Bank" },
    { custIdx: 1, billNo: "PL-2026-009", status: "Partial", paidFrac: 0.5,  discount: 100,  itemCount: 3, daysAgo: 12, mode: "Cash" },
    // Unpaid bills
    { custIdx: 7, billNo: "PL-2026-010", status: "Unpaid",  paidFrac: 0,    discount: 0,    itemCount: 2, daysAgo: 10, mode: null },
    { custIdx: 2, billNo: "PL-2026-011", status: "Unpaid",  paidFrac: 0,    discount: 0,    itemCount: 3, daysAgo: 8,  mode: null },
    { custIdx: 3, billNo: "PL-2026-012", status: "Unpaid",  paidFrac: 0,    discount: 50,   itemCount: 1, daysAgo: 5,  mode: null },
    // Recent bills
    { custIdx: 4, billNo: "PL-2026-013", status: "Paid",    paidFrac: 1.0,  discount: 0,    itemCount: 3, daysAgo: 3,  mode: "UPI" },
    { custIdx: 5, billNo: "PL-2026-014", status: "Partial", paidFrac: 0.3,  discount: 0,    itemCount: 2, daysAgo: 1,  mode: "Cash" },
    { custIdx: 6, billNo: "PL-2026-015", status: "Unpaid",  paidFrac: 0,    discount: 0,    itemCount: 4, daysAgo: 0,  mode: null },
  ];

  let billCount = 0;
  let paymentCount = 0;

  for (const cfg of billConfigs) {
    const customer = customers[cfg.custIdx];
    const items = makeBillItems([...products], cfg.itemCount);

    const subTotal = items.reduce((s, i) => s + i.baseAmount, 0);
    const totalCgst = items.reduce((s, i) => s + i.cgst, 0);
    const totalSgst = items.reduce((s, i) => s + i.sgst, 0);
    const total = +(subTotal + totalCgst + totalSgst - cfg.discount).toFixed(2);
    const paid = +(total * cfg.paidFrac).toFixed(2);
    const due = +(total - paid).toFixed(2);

    const billDate = new Date();
    billDate.setDate(billDate.getDate() - cfg.daysAgo);

    const bill = await prisma.bill.create({
      data: {
        userId: user.id,
        billNo: cfg.billNo,
        customerId: customer.id,
        customerName: customer.name,
        total,
        subTotal: +subTotal.toFixed(2),
        totalCgst: +totalCgst.toFixed(2),
        totalSgst: +totalSgst.toFixed(2),
        paid,
        due,
        status: cfg.status,
        discount: cfg.discount,
        paymentMode: cfg.mode,
        createdAt: billDate,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            rate: i.rate,
            cgst: i.cgst,
            sgst: i.sgst,
            baseAmount: i.baseAmount,
            lineTotal: i.lineTotal,
          })),
        },
      },
    });
    billCount++;

    // Create payment if any amount paid
    if (paid > 0 && cfg.mode) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          customerId: customer.id,
          billId: bill.id,
          billNo: cfg.billNo,
          amount: paid,
          mode: cfg.mode,
          date: billDate,
        },
      });
      paymentCount++;

      // For partial bills, add a second smaller payment from a different date
      if (cfg.status === "Partial" && cfg.paidFrac > 0.3) {
        const secondPayDate = new Date(billDate);
        secondPayDate.setDate(secondPayDate.getDate() + 2);
        const secondAmount = +(paid * 0.3).toFixed(2);
        // Update paid on first payment to be reduced
        await prisma.payment.create({
          data: {
            userId: user.id,
            customerId: customer.id,
            billId: bill.id,
            billNo: cfg.billNo,
            amount: secondAmount,
            mode: ["Cash", "UPI", "Bank"][Math.floor(Math.random() * 3)],
            date: secondPayDate,
          },
        });
        paymentCount++;
      }
    }
  }

  console.log(`  ✅ Bills: ${billCount} created`);
  console.log(`  ✅ Payments: ${paymentCount} created`);

  console.log("\n🎉 Seeding complete!");
  console.log("━".repeat(40));
  console.log("  Login with:");
  console.log("    Email:    test@packledger.in");
  console.log("    Password: test123");
  console.log("━".repeat(40));
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
