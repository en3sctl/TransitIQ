/**
 * Tüm CONFIRMED booking'ler için eksik Settlement kayıtlarını oluşturur.
 * Idempotent — tekrar çalıştırılabilir.
 *
 * Kullanım: npm run settle:backfill
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter } as any);

  const confirmed = await p.booking.findMany({
    where: { status: 'CONFIRMED' },
    select: { id: true, tenantId: true, pricePaid: true, bookingTime: true },
    take: 5000,
  });
  const existing = await p.settlement.findMany({
    where: { bookingId: { in: confirmed.map((b) => b.id) } },
    select: { bookingId: true },
  });
  const existingIds = new Set(existing.map((s) => s.bookingId));
  const todo = confirmed.filter((b) => !existingIds.has(b.id));

  const tenantIds = Array.from(new Set(todo.map((b) => b.tenantId)));
  const tenants = tenantIds.length
    ? await p.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, commissionRate: true } })
    : [];
  const rateById = new Map(tenants.map((t) => [t.id, Number(t.commissionRate) || 0]));

  let created = 0;
  for (const b of todo) {
    const gross = Number(b.pricePaid);
    const rate = rateById.get(b.tenantId) ?? 0;
    const commission = Math.round(gross * rate * 100) / 100;
    const net = Math.round((gross - commission) * 100) / 100;
    try {
      await p.settlement.create({
        data: {
          tenantId: b.tenantId,
          bookingId: b.id,
          grossAmount: gross,
          commissionAmount: commission,
          netAmount: net,
          commissionRate: rate,
          status: 'PENDING',
          // settlement createdAt'ı booking zamanına eşitle (doğru raporlama için)
          createdAt: b.bookingTime,
        },
      });
      created++;
    } catch { /* unique constraint — skip */ }
  }
  console.log(`\n✓ ${created} yeni settlement oluşturuldu (${confirmed.length} confirmed booking tarandı, ${existing.length} zaten vardı).`);
  await p.$disconnect();
}
main();
