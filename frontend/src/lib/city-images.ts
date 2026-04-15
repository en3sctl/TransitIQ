/**
 * City → photo mapping for authentic Turkish landmark imagery.
 * Used across landing sections and route cards to replace generic gradients.
 *
 * Photos live in /public. All paths are absolute from site root.
 * Each city has a primary photo + optional alternates for variety.
 */

export interface CityImage {
  src: string;
  alt: string;
  credit?: string;
}

const CITY_IMAGES: Record<string, CityImage[]> = {
  istanbul: [
    { src: '/bogaz_kopru.jpg', alt: 'Boğaz Köprüsü, İstanbul' },
    { src: '/kiz_kulesi.jpg', alt: 'Kız Kulesi, İstanbul' },
    { src: '/ortakoy.jpg', alt: 'Ortaköy, İstanbul' },
    { src: '/halic.jpg', alt: 'Haliç, İstanbul' },
    { src: '/ayasofya.webp', alt: 'Ayasofya, İstanbul' },
    { src: '/camlica.png', alt: 'Çamlıca, İstanbul' },
    { src: '/yss.jpg', alt: 'Yavuz Sultan Selim Köprüsü, İstanbul' },
    { src: '/kiz_kulesi2.jpg', alt: 'Kız Kulesi, İstanbul' },
    { src: '/ortakoy2.jpg', alt: 'Ortaköy, İstanbul' },
  ],
  ankara: [
    { src: '/anitkabir.jpg', alt: 'Anıtkabir, Ankara' },
    { src: '/anit.jpg', alt: 'Anıtkabir, Ankara' },
  ],
  izmir: [
    { src: '/efes.jpg', alt: 'Efes Antik Kenti, İzmir' },
    { src: '/harabeler.jpg', alt: 'Efes harabeleri, İzmir' },
  ],
  nevşehir: [{ src: '/kapadokya.png', alt: 'Kapadokya, Nevşehir' }],
  nevsehir: [{ src: '/kapadokya.png', alt: 'Kapadokya, Nevşehir' }],
  kapadokya: [{ src: '/kapadokya.png', alt: 'Kapadokya' }],
  adıyaman: [{ src: '/nemrut.jpg', alt: 'Nemrut Dağı, Adıyaman' }],
  adiyaman: [{ src: '/nemrut.jpg', alt: 'Nemrut Dağı, Adıyaman' }],
  denizli: [{ src: '/traverten.jpg', alt: 'Pamukkale travertenleri, Denizli' }],
  pamukkale: [{ src: '/traverten.jpg', alt: 'Pamukkale travertenleri' }],
  trabzon: [{ src: '/uzungol.webp', alt: 'Uzungöl, Trabzon' }],
  kastamonu: [{ src: '/valla_kanyonu.webp', alt: 'Valla Kanyonu, Kastamonu' }],
  'şanlıurfa': [{ src: '/balikligol.webp', alt: 'Balıklıgöl, Şanlıurfa' }],
  sanliurfa: [{ src: '/balikligol.webp', alt: 'Balıklıgöl, Şanlıurfa' }],
  urfa: [{ src: '/balikligol.webp', alt: 'Balıklıgöl, Urfa' }],
};

function normalize(city: string): string {
  return city
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .trim();
}

/**
 * Returns a single photo for a city. If multiple photos exist, picks one
 * deterministically from an index seed (so the same card always shows the same
 * photo — prevents flicker between renders).
 */
export function getCityImage(city: string, seed = 0): CityImage | null {
  if (!city) return null;
  const raw = city.toLowerCase().trim();
  const normalized = normalize(city);
  const images = CITY_IMAGES[raw] || CITY_IMAGES[normalized];
  if (!images || images.length === 0) return null;
  return images[seed % images.length];
}

/**
 * Returns all photos for a city, useful for galleries.
 */
export function getCityImages(city: string): CityImage[] {
  const raw = city.toLowerCase().trim();
  const normalized = normalize(city);
  return CITY_IMAGES[raw] || CITY_IMAGES[normalized] || [];
}

/**
 * Returns a fallback image if no city match (first İstanbul photo as generic TR visual).
 */
export function getCityImageWithFallback(city: string, seed = 0): CityImage {
  return getCityImage(city, seed) || { src: '/bogaz_kopru.jpg', alt: 'Türkiye' };
}

/**
 * Async variant: if no curated photo exists for the city, ask the backend
 * to fetch one from Wikipedia. Caches results in localStorage for 24 hours.
 */
export async function resolveCityImage(
  city: string,
  seed = 0,
  apiBase?: string,
): Promise<CityImage> {
  const local = getCityImage(city, seed);
  if (local) return local;

  if (typeof window === 'undefined') {
    return { src: '/bogaz_kopru.jpg', alt: 'Türkiye' };
  }

  const cacheKey = `city-img:${city.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { src: string | null; alt: string; at: number };
      if (Date.now() - parsed.at < 24 * 60 * 60 * 1000 && parsed.src) {
        return { src: parsed.src, alt: parsed.alt };
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    const base = apiBase || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${base}/city-image?city=${encodeURIComponent(city)}`, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    if (res.ok) {
      const data = await res.json();
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ src: data.url, alt: data.alt, at: Date.now() }));
      } catch {
        // localStorage full or unavailable, continue anyway
      }
      if (data.url) return { src: data.url, alt: data.alt };
    }
  } catch {
    // network error, timeout, CORS, etc. — silently fall back
  }

  return { src: '/bogaz_kopru.jpg', alt: `Türkiye - ${city}` };
}
