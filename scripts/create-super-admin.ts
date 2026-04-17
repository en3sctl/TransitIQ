/**
 * Bootstrap script: creates (or promotes) a SUPER_ADMIN account.
 *
 * Usage:
 *   npx tsx scripts/create-super-admin.ts <email> <password> [name]
 *
 * - If a user with this email exists, their role is upgraded to SUPER_ADMIN
 *   and they are attached to the platform tenant.
 * - Otherwise, a fresh SUPER_ADMIN user is created under the platform tenant.
 * - The "transitiq-platform" tenant is auto-created if missing.
 *
 * Run once per deployment. Safe to re-run (idempotent).
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const [, , email, password, nameArg] = process.argv;
  if (!email || !password) {
    console.error('Usage: tsx scripts/create-super-admin.ts <email> <password> [name]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Parola en az 8 karakter olmalı');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1) Ensure platform tenant exists
    let platform = await prisma.tenant.findUnique({ where: { slug: 'transitiq-platform' } });
    if (!platform) {
      platform = await prisma.tenant.create({
        data: {
          name: 'TransitIQ Platform',
          publicName: 'TransitIQ',
          slug: 'transitiq-platform',
          status: 'ACTIVE',
          commissionRate: 0, // platform charges itself nothing
          verifiedAt: new Date(),
        },
      });
      console.log(`✓ Platform tenant oluşturuldu: ${platform.id}`);
    } else {
      console.log(`✓ Platform tenant zaten var: ${platform.id}`);
    }

    // 2) Find or create user (email is unique per tenant, not globally)
    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'SUPER_ADMIN',
          tenantId: platform.id,
          passwordHash: await bcrypt.hash(password, 12),
        },
      });
      console.log(`✓ Mevcut kullanıcı SUPER_ADMIN'e yükseltildi: ${email}`);
    } else {
      const hash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: nameArg || 'Platform Admin',
          passwordHash: hash,
          role: 'SUPER_ADMIN',
          tenantId: platform.id,
        },
      });
      console.log(`✓ Yeni SUPER_ADMIN oluşturuldu: ${user.email} (id=${user.id})`);
    }

    console.log('\nGirişe hazır:');
    console.log(`  E-posta: ${email}`);
    console.log(`  Parola: ${password}`);
    console.log(`  Panel: /admin`);
  } catch (err) {
    console.error('Hata:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
