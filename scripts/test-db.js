const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Successfully connected to database!');
    
    // Check if User table exists by counting records
    try {
      const count = await prisma.user.count();
      console.log(`User table accessible. Count: ${count}`);
    } catch (e) {
      if (e.code === 'P2021') {
        console.log('User table does not exist.');
      } else {
        throw e;
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

main();
