import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      name: 'Regular User 1',
      password: userPassword,
      role: 'USER'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      name: 'Regular User 2',
      password: userPassword,
      role: 'USER'
    }
  });

  // Create test appointments
  const now = new Date();
  const tomorrow = new Date(now.setDate(now.getDate() + 1));
  const dayAfter = new Date(now.setDate(now.getDate() + 1));

  await prisma.appointment.create({
    data: {
      title: 'Team Meeting',
      description: 'Weekly team sync-up',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
    }
  });

  await prisma.appointment.create({
    data: {
      title: 'Project Review',
      description: 'Monthly project status review',
      startTime: dayAfter,
      endTime: new Date(dayAfter.getTime() + 120 * 60 * 1000), // 2 hours later
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });