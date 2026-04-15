import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Fetches city landmark images from Wikipedia's free REST API.
 * Results are cached in-memory (per-process) and fall back to a null result
 * if the Wikipedia page cannot be located.
 *
 * No API key required. Respects Wikipedia's fair-use policy: images are returned
 * as external URLs, not proxied/stored.
 */
@Injectable()
export class CityImageService {
  private readonly logger = new Logger(CityImageService.name);
  private readonly cache = new Map<string, { url: string | null; alt: string; fetchedAt: number }>();
  private readonly CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Known cities where Wikipedia article title differs from city name
  private readonly ALIASES: Record<string, string> = {
    karabük: 'Safranbolu',
    konya: 'Mevlana Müzesi',
    adana: 'Taşköprü (Adana)',
    mersin: 'Kız Kulesi (Mersin)',
    eskişehir: 'Odunpazarı',
    kars: 'Ani',
    sivas: 'Divriği Ulu Camii',
    gaziantep: 'Zeugma',
    hatay: 'Hatay Arkeoloji Müzesi',
  };

  constructor(private prisma: PrismaService) {}

  async getImageForCity(city: string): Promise<{ url: string | null; alt: string }> {
    if (!city?.trim()) return { url: null, alt: '' };

    const key = city.trim().toLowerCase();
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < this.CACHE_TTL_MS) {
      return { url: cached.url, alt: cached.alt };
    }

    const articleTitle = this.ALIASES[key] || city.trim();
    const url = await this.fetchWikipediaImage(articleTitle);
    const alt = `${city} - ${articleTitle}`;

    this.cache.set(key, { url, alt, fetchedAt: Date.now() });
    return { url, alt };
  }

  private async fetchWikipediaImage(pageTitle: string): Promise<string | null> {
    try {
      const encoded = encodeURIComponent(pageTitle);
      // Try Turkish Wikipedia first
      const trUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encoded}?redirect=true`;
      const res = await fetch(trUrl, {
        headers: { 'User-Agent': 'TransitIQ/1.0 (destek@transitiq.com)' },
      });
      if (res.ok) {
        const data: any = await res.json();
        const src = data?.originalimage?.source || data?.thumbnail?.source;
        if (src) return src;
      }

      // Fallback to English Wikipedia
      const enUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}?redirect=true`;
      const res2 = await fetch(enUrl, {
        headers: { 'User-Agent': 'TransitIQ/1.0 (destek@transitiq.com)' },
      });
      if (res2.ok) {
        const data: any = await res2.json();
        return data?.originalimage?.source || data?.thumbnail?.source || null;
      }
    } catch (e) {
      this.logger.warn(`Wikipedia fetch failed for "${pageTitle}": ${e}`);
    }
    return null;
  }
}
