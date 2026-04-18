/**
 * TR input formatters — kullanıcı yazdıkça format uygula.
 * Pattern: `onChange={(e) => setX(formatFoo(e.target.value))}`
 *
 * Amaç: kullanıcının tire/boşluk/büyük harf gibi detaylarla uğraşmaması.
 */

/** 11 hane rakam, sadece digits. */
export function formatTcKimlik(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11);
}

/** TR telefon: "0532 123 45 67" formatında gruplanır. 11 haneye kadar. */
export function formatPhoneTR(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length <= 9) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
}

/** 10 hane vergi no, sadece digits. */
export function formatTaxId(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

/** MERSİS: 16 hane → "XXXX-XXXX-XXXX-XXXX" */
export function formatMersis(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 16);
  const parts = [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 16)].filter(Boolean);
  return parts.join('-');
}

/** D belgesi: "[Harf][Rakam]-[Rakamlar]" oto-uppercase. D112345 → D1-12345 */
export function formatLicenseTR(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 0) return '';
  const letter = cleaned.slice(0, 1).replace(/[^A-Z]/g, '');
  if (!letter) return '';
  const rest = cleaned.slice(1);
  if (rest.length === 0) return letter;
  const digit = rest.slice(0, 1).replace(/\D/g, '');
  if (!digit) return letter;
  const tail = rest.slice(1).replace(/\D/g, '').slice(0, 15);
  return tail ? `${letter}${digit}-${tail}` : `${letter}${digit}`;
}

/** TR plaka: "34 ABC 1234" formatında oto-uppercase + grupla. */
export function formatPlateTR(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 0) return '';
  // İl kodu 2 hane rakam
  const city = cleaned.slice(0, 2).replace(/\D/g, '');
  if (city.length < 2) return city;
  const rest = cleaned.slice(2);
  // Harfler (1-3 harf)
  const lettersMatch = rest.match(/^[A-Z]{1,3}/);
  if (!lettersMatch) return city;
  const letters = lettersMatch[0];
  // Kalan rakamlar (1-4 hane)
  const numbers = rest.slice(letters.length).replace(/\D/g, '').slice(0, 4);
  return numbers ? `${city} ${letters} ${numbers}` : `${city} ${letters}`;
}

/**
 * IBAN: "TRXX XXXX XXXX XXXX XXXX XXXX XX" (26 karakter, 4'erli gruplar).
 * Oto-uppercase (TR prefix için) ve boşluklar otomatik eklenir.
 */
export function formatIBAN(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 26);
  return cleaned.match(/.{1,4}/g)?.join(' ') || '';
}

/** Kredi kartı: "XXXX XXXX XXXX XXXX" (16 digit, 4'erli). */
export function formatCreditCard(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 16);
  return d.match(/.{1,4}/g)?.join(' ') || '';
}

/** Kart SKT: "AA/YY" (4 digit). */
export function formatCardExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

// ═══════════════════════════════════════════════════════
// Validators (formatter'dan bağımsız — submit öncesi)
// ═══════════════════════════════════════════════════════

/** Gerçek TC kimlik algoritma doğrulaması (11 hane + checksum). */
export function isValidTcKimlik(raw: string): boolean {
  const s = raw.replace(/\D/g, '');
  if (s.length !== 11) return false;
  if (s[0] === '0') return false;
  const digits = s.split('').map(Number);
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const even = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = ((odd * 7) - even) % 10;
  const d11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  return d10 === digits[9] && d11 === digits[10];
}

/** TR telefon: 11 hane, 0 ile başlar. */
export function isValidPhoneTR(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  return d.length === 11 && d.startsWith('0');
}

/** IBAN: 26 hane, TR prefix, IBAN MOD-97 doğrulaması. */
export function isValidIBAN(raw: string): boolean {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length !== 26 || !s.startsWith('TR')) return false;
  // MOD-97: ilk 4 karakter sona taşı, harfleri sayıya çevir (A=10), %97 === 1 olmalı
  const shifted = s.slice(4) + s.slice(0, 4);
  let num = '';
  for (const c of shifted) {
    num += /\d/.test(c) ? c : (c.charCodeAt(0) - 55).toString();
  }
  // BigInt mod 97
  let remainder = 0;
  for (const c of num) {
    remainder = (remainder * 10 + Number(c)) % 97;
  }
  return remainder === 1;
}
