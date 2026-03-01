/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.bwngfgcfqwuonvtbjtut:Tanish%4029%4011%402005%40@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    },
  },
});

async function main() {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (user) {
        console.log(`LATEST USER: ${user.email}`);
        console.log(`OTP: ${user.otp}`);
    } else {
        console.log("No users found.");
    }
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
