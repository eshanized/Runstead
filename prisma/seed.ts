import { seedDatabase } from '../lib/db/seed.ts';

seedDatabase()
  .then(() => {
    console.log('Prisma seed completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Prisma seed error:', err);
    process.exit(1);
  });
