/**
 * Acil bakım modu kontrolü — terminalden direkt çalıştır.
 *
 * Kullanım:
 *   npm run maintenance        → mevcut durumu gösterir
 *   npm run maintenance off    → bakım modunu kapatır
 *   npm run maintenance on     → bakım modunu açar
 *
 * Eğer panele giremiyorsan (çünkü bakım modu açık) bunu çalıştır.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const action = (process.argv[2] || 'status').toLowerCase();

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL .env içinde tanımlı değil');
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter } as any);

  try {
    if (action === 'status') {
      const setting = await prisma.platformSetting.findUnique({ where: { key: 'MAINTENANCE_MODE' } });
      const isOn = setting?.value === 'true' && setting?.type === 'boolean';
      console.log('');
      console.log('═'.repeat(50));
      console.log(`  Bakım Modu: ${isOn ? '🔴 AÇIK' : '🟢 KAPALI'}`);
      console.log(`  DB değeri: ${setting ? `value="${setting.value}" type="${setting.type}"` : '(kayıt yok → varsayılan: false)'}`);
      console.log('═'.repeat(50));
      console.log('');
      console.log('Açmak için:  npm run maintenance on');
      console.log('Kapatmak için: npm run maintenance off');
      console.log('');
      return;
    }

    if (action === 'off' || action === 'kapat') {
      await prisma.platformSetting.upsert({
        where: { key: 'MAINTENANCE_MODE' },
        create: { key: 'MAINTENANCE_MODE', value: 'false', type: 'boolean', updatedBy: 'cli' },
        update: { value: 'false', type: 'boolean', updatedBy: 'cli' },
      });
      console.log('🟢 Bakım modu KAPATILDI. Sistem normal çalışıyor.');
      return;
    }

    if (action === 'on' || action === 'aç' || action === 'ac') {
      await prisma.platformSetting.upsert({
        where: { key: 'MAINTENANCE_MODE' },
        create: { key: 'MAINTENANCE_MODE', value: 'true', type: 'boolean', updatedBy: 'cli' },
        update: { value: 'true', type: 'boolean', updatedBy: 'cli' },
      });
      console.log('🔴 Bakım modu AÇILDI. Yeni rezervasyon/ödeme alınmayacak.');
      return;
    }

    console.error(`Bilinmeyen komut: "${action}". Kullanım: npm run maintenance [on|off|status]`);
    process.exit(1);
  } catch (err: any) {
    console.error('Hata:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
