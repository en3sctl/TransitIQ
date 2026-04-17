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

  const bookings = await p.booking.findMany({
    where: { tenantId: t.id, status: 'CONFIRMED' },
    select: { id: true, bookingTime: true, pricePaid: true },
    orderBy: { bookingTime: 'asc' },
  });
  const settlements = await p.settlement.findMany({
    where: { tenantId: t.id },
    select: { bookingId: true, createdAt: true, grossAmount: true },
  });
  const settledIds = new Set(settlements.map((s) => s.bookingId));

  console.log(`\n${t.publicName || t.name} (/${t.slug}) — komisyon %${(Number(t.commissionRate) * 100).toFixed(2)}\n`);
  console.log(`CONFIRMED bookings: ${bookings.length}`);
  if (bookings.length > 0) {
    const earliest = bookings[0].bookingTime;
    const latest = bookings[bookings.length - 1].bookingTime;
    console.log(`  Tarih aralığı: ${earliest.toISOString().slice(0, 10)}  →  ${latest.toISOString().slice(0, 10)}`);
  }
  console.log(`Settlement kayıtları: ${settlements.length}`);
  if (settlements.length > 0) {
    const earliest = settlements.map((s) => s.createdAt).sort()[0];
    const latest = settlements.map((s) => s.createdAt).sort().pop()!;
    console.log(`  Tarih aralığı: ${earliest.toISOString().slice(0, 10)}  →  ${latest.toISOString().slice(0, 10)}`);
  }
  const missing = bookings.filter((b) => !settledIds.has(b.id));
  if (missing.length > 0) {
    console.log(`\n⚠ Settlement'ı eksik ${missing.length} booking var.`);
  }
  console.log('');
  await p.$disconnect();
}
main();
