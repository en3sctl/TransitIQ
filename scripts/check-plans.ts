import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter } as any);
  const plans = await p.subscriptionPlan.findMany();
  const tenants = await p.tenant.findMany({
    select: { id: true, name: true, slug: true, status: true, planId: true, plan: { select: { name: true, maxVehicles: true } } },
  });
  console.log(`\nToplam ${plans.length} plan:`);
  for (const pl of plans) console.log(`  ${pl.name.padEnd(15)} slug=${pl.slug.padEnd(12)} komisyon=%${(Number(pl.commissionRate) * 100).toFixed(1)} araç=${pl.maxVehicles ?? '∞'}`);
  console.log(`\nTenant plan ataması:`);
  for (const t of tenants) {
    console.log(`  [${t.status}] ${(t.name).padEnd(35)} plan=${t.plan?.name || '(YOK)'}`);
  }
  await p.$disconnect();
}
main();
