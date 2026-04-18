/**
 * Plansız tenant'lara varsayılan "Başlangıç" planını atar.
 * Super-admin ve TransitIQ Passengers tenant'ları skip edilir (platform-only).
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter } as any);

  const starter = await p.subscriptionPlan.findUnique({ where: { slug: 'starter' } });
  if (!starter) {
    console.error('"starter" planı bulunamadı. Önce `/super-admin/plans/seed` çağır ya da panelden seed et.');
    process.exit(1);
  }

  const candidates = await p.tenant.findMany({
    where: {
      planId: null,
      deletedAt: null,
      slug: { notIn: ['public-passengers', 'transitiq-platform'] },
    },
    select: { id: true, name: true, slug: true },
  });

  console.log(`\n${candidates.length} firma plansız — Başlangıç planı atanıyor...\n`);
  let updated = 0;
  for (const t of candidates) {
    await p.tenant.update({
      where: { id: t.id },
      data: { planId: starter.id, commissionRate: starter.commissionRate },
    });
    console.log(`  ✓ ${t.name} (/${t.slug}) → Başlangıç`);
    updated++;
  }
  console.log(`\n✓ ${updated} firma güncellendi.\n`);
  await p.$disconnect();
}
main();
