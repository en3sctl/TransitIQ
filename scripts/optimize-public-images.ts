/**
 * Frontend public/ klasöründeki büyük image'ları optimize eder.
 *
 *   npm run optimize:images
 *
 * Davranış:
 * - frontend/public/ altındaki .jpg/.jpeg/.png/.webp dosyaları tarar
 * - Sadece > 500KB OLAN ve genişliği > 1920px olan dosyaları işler
 *   (logo'lar, ikonlar, küçük görseller dokunulmaz)
 * - max 1920px width, kalite 80 ile yeniden encode eder
 * - Format korunur (.jpg → .jpg, .png → .png) — Next.js Image runtime'da webp'ye çevirir
 * - Orijinal dosyaları frontend/public/.originals/ altına yedekler (ilk seferde)
 * - Tekrar çalıştırınca: zaten optimize olanları (yedek varsa) skip eder
 *
 * Sonuç: 5 MB harabeler.jpg → ~400 KB, ana sayfa kasması biter.
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'frontend', 'public');
const BACKUP_DIR = path.join(PUBLIC_DIR, '.originals');
const MAX_WIDTH = 1920;
const QUALITY = 80;
const MIN_SIZE_BYTES = 500 * 1024; // 500 KB altı dokunulmaz

const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function fmtBytes(b: number) {
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(2) + ' MB';
  return (b / 1024).toFixed(0) + ' KB';
}

async function processFile(filePath: string) {
  const stat = fs.statSync(filePath);
  if (stat.size < MIN_SIZE_BYTES) return { status: 'skip-small' as const };

  const ext = path.extname(filePath).toLowerCase();
  const relName = path.basename(filePath);
  const backupPath = path.join(BACKUP_DIR, relName);

  // Backup yapıldıysa zaten optimize edilmiş — atla
  if (fs.existsSync(backupPath)) {
    return { status: 'skip-already' as const, originalSize: stat.size };
  }

  const meta = await sharp(filePath).metadata();
  const w = meta.width || 0;
  if (w <= MAX_WIDTH) {
    return { status: 'skip-narrow' as const, width: w };
  }

  // Yedekle
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.copyFileSync(filePath, backupPath);

  // Pipeline: format'a göre encoder seçer, transparency korur (PNG/WebP)
  let pipeline = sharp(filePath).resize({ width: MAX_WIDTH, withoutEnlargement: true });
  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: QUALITY });
  } else {
    pipeline = pipeline.jpeg({ quality: QUALITY, progressive: true, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();
  fs.writeFileSync(filePath, buffer);

  return {
    status: 'optimized' as const,
    originalSize: stat.size,
    newSize: buffer.length,
    width: w,
  };
}

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('frontend/public/ bulunamadı — script root TransitIQ/ olmalı');
    process.exit(1);
  }

  const files = fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => EXTS.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(PUBLIC_DIR, f));

  console.log(`📂 ${files.length} image bulundu, taranıyor...\n`);

  let totalSaved = 0;
  let optimizedCount = 0;
  let skippedSmall = 0;
  let skippedNarrow = 0;
  let skippedAlready = 0;

  for (const fp of files) {
    const name = path.basename(fp);
    try {
      const r = await processFile(fp);
      if (r.status === 'optimized') {
        const saved = (r.originalSize ?? 0) - (r.newSize ?? 0);
        totalSaved += saved;
        optimizedCount++;
        console.log(
          `✅ ${name}: ${fmtBytes(r.originalSize ?? 0)} → ${fmtBytes(r.newSize ?? 0)} (${fmtBytes(saved)} kazanç, ${r.width}px)`,
        );
      } else if (r.status === 'skip-small') {
        skippedSmall++;
      } else if (r.status === 'skip-narrow') {
        skippedNarrow++;
      } else if (r.status === 'skip-already') {
        skippedAlready++;
        console.log(`⏭  ${name}: zaten optimize edilmiş (yedek mevcut)`);
      }
    } catch (err: any) {
      console.error(`❌ ${name}: ${err.message || err}`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅ Optimize: ${optimizedCount}`);
  console.log(`⏭  Zaten optimize: ${skippedAlready}`);
  console.log(`📦 Küçük (<500KB) atlandı: ${skippedSmall}`);
  console.log(`📐 Genişliği yeterli (<${MAX_WIDTH}px) atlandı: ${skippedNarrow}`);
  console.log(`💾 Toplam kazanç: ${fmtBytes(totalSaved)}`);
  if (optimizedCount > 0) {
    console.log(`\n📁 Yedekler: ${BACKUP_DIR}`);
    console.log('   → frontend/.gitignore zaten public/.originals/ ignore ediyor — git\'e gitmez.');
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
