/**
 * Türkiye araç ruhsatı (motorlu araç tescil belgesi) OCR parser.
 *
 * Güvenlik: tüm işlem istemci tarafında (Tesseract WASM). Görsel asla sunucuya
 * gönderilmez.
 *
 * Strateji:
 * 1. Görsel önişleme — grayscale + kontrast + max 2400px → OCR doğruluğu
 * 2. Tesseract.js Türkçe dil modeli
 * 3. Skor tabanlı alan çıkarımı — etiket yakınlığı + whitelist + blacklist
 */

export interface RuhsatData {
  plate?: string;
  chassis?: string;
  engine?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  fuel?: string;
  rawText: string;
  confidence: number;
}

/**
 * Ruhsatta yaygın görülen markalar. AMBİGUOUS KISA ADLAR KALDIRILDI (BENZ, VW)
 * çünkü metnin herhangi bir yerinde geçebilir ve yanlış match verirler.
 * MERCEDES-BENZ tam hâli tek başına yeterli.
 */
const KNOWN_MAKES = [
  'MERCEDES-BENZ', 'MERCEDES', 'LAND ROVER', 'LANDROVER',
  'TOYOTA', 'HONDA', 'FORD', 'RENAULT', 'PEUGEOT', 'FIAT', 'OPEL', 'VOLKSWAGEN',
  'AUDI', 'SKODA', 'SEAT', 'CITROEN', 'HYUNDAI', 'NISSAN', 'MAZDA',
  'MITSUBISHI', 'CHEVROLET', 'SUZUKI', 'DACIA', 'TESLA',
  'MAN', 'IVECO', 'SCANIA', 'VOLVO', 'ISUZU', 'BMC', 'OTOKAR', 'TEMSA',
  'NEOPLAN', 'SETRA',
  'KIA', 'BMW', 'JAGUAR', 'MINI', 'PORSCHE', 'SUBARU', 'LEXUS',
  'CHERY', 'GEELY', 'SAIPA', 'TATA', 'MAHINDRA', 'TOFAS', 'TOFAŞ',
];

const KNOWN_COLORS = [
  'BEYAZ', 'SİYAH', 'SIYAH', 'GRİ', 'GRI', 'KIRMIZI', 'MAVI', 'MAVİ',
  'YEŞİL', 'YESIL', 'SARI', 'LACIVERT', 'LACİVERT', 'KAHVERENGI', 'KAHVERENGİ',
  'TURUNCU', 'MOR', 'ALTIN', 'GUMUS', 'GÜMÜŞ', 'BEJ', 'BORDO', 'PEMBE',
];

const FUEL_TYPES = [
  'DIZEL', 'DİZEL', 'BENZIN', 'BENZİN', 'LPG',
  'ELEKTRIK', 'ELEKTRİK', 'HIBRIT', 'HİBRİT', 'CNG', 'LNG',
];

/**
 * Model alanı için blacklist: bu kelimeler başlarsa model değildir, etiketlerdir.
 * ("ONAY NO", "TESCİL", "SAHİP", "BELGE" gibi).
 */
const MODEL_BLACKLIST_WORDS = new Set([
  'ONAY', 'TESCIL', 'TESCİL', 'SAHIP', 'SAHİP', 'BELGE', 'BELGESI', 'BELGESİ',
  'ADI', 'SOYADI', 'ADRES', 'TCKN', 'TC', 'VERGI', 'VERGİ', 'NO', 'NUMARASI',
  'IL', 'İL', 'ILCE', 'İLÇE', 'TARIH', 'TARİH', 'MUAYENE', 'SIGORTA', 'SİGORTA',
  'RUHSAT', 'MOTORLU', 'ARAÇ', 'ARAC', 'MARKA', 'MARKASI', 'MODEL', 'YILI',
]);

async function preprocessImage(file: File | Blob): Promise<Blob> {
  if (typeof window === 'undefined') return file;

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');

  const maxDim = 2400;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let out = gray;
    if (gray < 110) out = Math.max(0, gray - 40);
    else if (gray > 160) out = Math.min(255, gray + 30);
    d[i] = d[i + 1] = d[i + 2] = out;
  }
  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || file), 'image/png');
  });
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export async function parseRuhsatImage(
  imageFile: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<RuhsatData> {
  const preprocessed = await preprocessImage(imageFile);

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('tur', 1, {
    logger: (m: any) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress);
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: '6' as any,
    });

    const result = await worker.recognize(preprocessed);
    const text = result.data.text || '';
    const confidence = result.data.confidence || 0;

    return {
      ...extractFields(text),
      rawText: text,
      confidence,
    };
  } finally {
    await worker.terminate();
  }
}

function extractFields(text: string): Partial<RuhsatData> {
  const normalized = text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .toUpperCase();

  const fields: Partial<RuhsatData> = {};

  // ─── Plaka ───
  const plateRe = /\b(\d{2})[\s-]*([A-Z]{1,3})[\s-]*([A-Z0-9]{2,4})\b/;
  const plateMatch = normalized.match(plateRe);
  if (plateMatch) {
    fields.plate = `${plateMatch[1]} ${plateMatch[2]} ${plateMatch[3]}`;
  }

  // ─── Marka (skor tabanlı) ───
  // Tüm whitelist markalarını bul, en iyi match'i seç:
  // - Uzun isim = daha spesifik (MERCEDES-BENZ > MERCEDES)
  // - MARKA etiketi yakınındaysa bonus
  fields.make = findBestMake(normalized);

  // ─── Model: marka bulunduktan sonra ardındaki ilk geçerli kelime grubu ───
  if (fields.make) {
    fields.model = findModelAfterMake(normalized, fields.make);
  }
  if (!fields.model) {
    // Fallback: TİP etiketi sonrası
    const tipRe = /(?:T[İI]P[İI]?|MODEL[İI]?)[\s:.]*([A-Z0-9][A-Z0-9\s\-.]{1,25})/;
    const tipMatch = normalized.match(tipRe);
    if (tipMatch) {
      const cleaned = cleanModelCandidate(tipMatch[1]);
      if (cleaned) fields.model = cleaned;
    }
  }

  // ─── VIN / Şasi (ŞASİ NO etiketinden sonra ara, bulamazsan genel regex) ───
  fields.chassis = findChassis(normalized);

  // ─── Motor No ───
  const engineRe = /MOTOR[\s-]*(?:NO|NUMARA|NUMARASI|SER[İI]|S[İI]C[İI]L)[\s:.]*([A-Z0-9]{5,20})/;
  const engineMatch = normalized.match(engineRe);
  if (engineMatch) fields.engine = engineMatch[1];

  // ─── Yıl (SADECE MODEL YILI etiketi yakınından) ───
  fields.year = findYear(normalized);

  // ─── Renk (whitelist) ───
  for (const color of KNOWN_COLORS) {
    const re = new RegExp(`\\b${color}\\b`);
    if (re.test(normalized)) {
      fields.color = color;
      break;
    }
  }

  // ─── Yakıt ───
  for (const fuel of FUEL_TYPES) {
    const re = new RegExp(`\\b${fuel}\\b`);
    if (re.test(normalized)) {
      fields.fuel = fuel;
      break;
    }
  }

  return fields;
}

/**
 * Find the best make by scoring each whitelist hit.
 * Score = name length × 2 + (50 if within 80 chars of "MARKA" label else 0).
 */
function findBestMake(text: string): string | undefined {
  let bestMake: string | undefined;
  let bestScore = -1;

  const markaIdx = text.search(/MARKA(?:SI|Sİ)?/);

  for (const make of KNOWN_MAKES) {
    const escaped = make.replace(/[-]/g, '[\\s-]?');
    const re = new RegExp(`\\b${escaped}\\b`);
    const match = text.match(re);
    if (!match) continue;

    let score = make.length * 2;
    if (markaIdx >= 0 && match.index !== undefined) {
      const distance = Math.abs(match.index - markaIdx);
      if (distance < 80) score += 50;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMake = make;
    }
  }

  return bestMake;
}

/**
 * Extract the model name by looking at text immediately after the make.
 * Skip blacklisted label words (ONAY, TESCIL, etc.) that often appear between make and model.
 */
function findModelAfterMake(text: string, make: string): string | undefined {
  const escaped = make.replace(/[-]/g, '[\\s-]?');
  const re = new RegExp(`\\b${escaped}\\b`);
  const match = text.match(re);
  if (!match || match.index === undefined) return undefined;

  const tail = text.slice(match.index + make.length, match.index + make.length + 100);

  // Break text into word tokens
  const tokens = tail
    .split(/[\s:.\-\/\r\n]+/)
    .filter(Boolean)
    .slice(0, 8);

  const modelWords: string[] = [];
  for (const tok of tokens) {
    const up = tok.toUpperCase();
    if (MODEL_BLACKLIST_WORDS.has(up)) {
      // If we haven't collected anything yet, skip this label and keep looking
      if (modelWords.length === 0) continue;
      // If we already have model words, STOP (we've run into a new field label)
      break;
    }
    // Stop if we hit a standalone 4-digit year or a section that looks like a new field
    if (/^\d{4}$/.test(tok) || /^[A-Z]{2,3}\d{3,}$/.test(tok)) break;
    // Accept alphanumeric, hyphens, dots
    if (/^[A-Z0-9][A-Z0-9.\-]{0,20}$/i.test(tok)) {
      modelWords.push(up);
      if (modelWords.length >= 4) break;
    } else {
      // Unknown token — if we already have words, stop
      if (modelWords.length > 0) break;
    }
  }

  if (modelWords.length === 0) return undefined;
  return modelWords.join(' ').slice(0, 40);
}

function cleanModelCandidate(s: string): string | undefined {
  const cleaned = s.trim().replace(/\s{2,}/g, ' ').slice(0, 40);
  if (cleaned.length < 2) return undefined;
  const firstWord = cleaned.split(/\s+/)[0].toUpperCase();
  if (MODEL_BLACKLIST_WORDS.has(firstWord)) return undefined;
  return cleaned;
}

/**
 * Chassis/VIN: prefer the one near "ŞASİ" label. Fall back to any 17-char
 * alphanumeric respecting VIN format (no I/O/Q).
 */
function findChassis(text: string): string | undefined {
  const labelRe = /(?:ŞAS[İI]|SASI|[ŞS]AS[İI])[\s-]*(?:NO|NUMARA|NUMARASI)?[\s:.]*([A-HJ-NPR-Z0-9]{10,17})/;
  const labelMatch = text.match(labelRe);
  if (labelMatch && labelMatch[1].length >= 10) return labelMatch[1];

  // Fallback — require at least 13 chars for VIN (some older TR plates shorter)
  const vinRe = /\b([A-HJ-NPR-Z0-9]{17})\b/;
  const vinMatch = text.match(vinRe);
  if (vinMatch) return vinMatch[1];

  return undefined;
}

/**
 * Year: require MODEL YILI / İMAL YILI label proximity. Only fall back to
 * standalone year if absolutely no label found.
 */
function findYear(text: string): number | undefined {
  const currentYear = new Date().getFullYear();

  const labelRe = /(?:MODEL[\s-]*YIL[İI]?|[İI]MAL[\s-]*YIL[İI]?|MODEL\s*Y[İI]L[İI])[\s:.]*(\d{4})/;
  const labelMatch = text.match(labelRe);
  if (labelMatch) {
    const y = parseInt(labelMatch[1], 10);
    if (y >= 1980 && y <= currentYear + 1) return y;
  }

  // Broader fallback: find 4-digit years anywhere, pick the MOST RECENT in valid range.
  // Rationale: ruhsatta yıl tekrarlı olabilir (üretim, tescil), en yakın olanı model yılıdır.
  const all = Array.from(text.matchAll(/\b(19[8-9]\d|20[0-5]\d)\b/g))
    .map((m) => parseInt(m[1], 10))
    .filter((y) => y >= 1980 && y <= currentYear + 1);

  if (all.length === 0) return undefined;
  // Prefer latest year (usually the actual model year, not an address postal code or similar)
  return Math.max(...all);
}
