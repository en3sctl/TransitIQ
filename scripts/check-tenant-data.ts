import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();
async function main() {
  const slug = process.argv[2];
  if (!slug) { console.error('Kullanım: npm run check-tenant <slug>'); process.exit(1); }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter } as any);
  const t = await p.tenant.findUnique({ where: { slug } });
  if (!t) { console.error(`"${slug}" bulunamadı`); process.exit(1); }

  const [bookings, confirmed, settlements] = await Promise.all([
    p.booking.count({ where: { tenantId: t.id } }),
    p.booking.count({ where: { tenantId: t.id, status: 'CONFIRMED' } }),
    p.settlement.count({ where: { tenantId: t.id } }),
  ]);
  const settlementSum = await p.settlement.aggregate({
    where: { tenantId: t.id },
    _sum: { grossAmount: true, commissionAmount: true, netAmount: true },
  });

  console.log(`\nFirma: ${t.publicName || t.name} (/${t.slug})`);
  console.log(`Status: ${t.status}, Komisyon: %${(Number(t.commissionRate) * 100).toFixed(2)}`);
  console.log(`Bookings (toplam):    ${bookings}`);
  console.log(`Bookings (CONFIRMED): ${confirmed}`);
  console.log(`Settlement kayıtları: ${settlements}`);
  console.log(`Settlement brüt:      ${Number(settlementSum._sum.grossAmount || 0)} TL`);
  console.log(`Settlement komisyon:  ${Number(settlementSum._sum.commissionAmount || 0)} TL`);

  if (confirmed > 0 && settlements === 0) {
    console.log(`\n⚠ ${confirmed} confirmed booking var ama settlement yok.`);
    console.log(`   Çözüm: super-admin panelinden "Settlement Backfill" çalıştır`);
    console.log(`   veya: POST /super-admin/settlements/backfill`);
  }
  console.log('');
  await p.$disconnect();
}
main();
