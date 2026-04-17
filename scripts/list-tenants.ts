import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter } as any);
  const ts = await p.tenant.findMany({
    select: { id: true, name: true, publicName: true, slug: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`\nToplam ${ts.length} firma:\n`);
  for (const t of ts) {
    console.log(`  [${t.status.padEnd(9)}] ${(t.publicName || t.name).padEnd(28)} /${t.slug}`);
  }
  console.log('');
  await p.$disconnect();
}
main();
