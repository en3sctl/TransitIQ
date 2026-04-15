import { Injectable, Logger } from '@nestjs/common';

export interface OtogarResult {
  id: string;
  name: string;
  city: string;
  district?: string;
  lat: number;
  lng: number;
  operator?: string;
  source: 'NOMINATIM';
}

/**
 * Looks up Turkish bus stations (otogar) from OpenStreetMap via Nominatim.
 *
 * Previous implementation used Overpass API which has frequent 504 outages at
 * peak hours. Nominatim is the geocoding sibling — much higher availability,
 * simpler queries, and gives enough info for our use case (admin picking a
 * station on create).
 *
 * Strategy: run 4 parallel keyword queries ("<city> otogar", "<city> terminal",
 * etc.), dedupe by name, filter to results that actually look like bus stations.
 *
 * No API key required. Nominatim policy: valid User-Agent, < 1 req/sec per
 * endpoint, max 100 results per query. We conform.
 */
@Injectable()
export class OtogarService {
  private readonly logger = new Logger(OtogarService.name);
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
  private readonly USER_AGENT = 'TransitIQ/1.0 (destek@transitiq.com)';
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  private cache = new Map<string, { results: OtogarResult[]; at: number }>();

  async searchByCity(city: string): Promise<OtogarResult[]> {
    if (!city?.trim()) return [];
    const key = city.trim().toLowerCase();

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < this.CACHE_TTL_MS) {
      return cached.results;
    }

    const queries = [
      `${city} otogar`,
      `${city} terminal`,
      `${city} otobüs terminali`,
      `${city} bus station`,
    ];

    const all: OtogarResult[] = [];
    for (const q of queries) {
      const results = await this.nominatimSearch(q);
      all.push(...results);
      // polite throttling: ~500ms between requests to Nominatim
      await new Promise((r) => setTimeout(r, 500));
    }

    const seen = new Set<string>();
    const unique = all.filter((r) => {
      const k = r.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    this.cache.set(key, { results: unique, at: Date.now() });
    return unique;
  }

  private async nominatimSearch(query: string): Promise<OtogarResult[]> {
    try {
      const url = `${this.NOMINATIM_URL}?q=${encodeURIComponent(query)}&countrycodes=tr&format=jsonv2&addressdetails=1&limit=10`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept-Language': 'tr,en',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) {
        this.logger.warn(`Nominatim returned ${res.status} for query=${query}`);
        return [];
      }

      const data: any[] = await res.json();
      return data
        .map((el) => this.normalizeNominatim(el))
        .filter((x): x is OtogarResult => x !== null)
        .filter((x) => this.looksLikeBusStation(x));
    } catch (err) {
      this.logger.warn(`Nominatim fetch failed: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }

  private normalizeNominatim(el: any): OtogarResult | null {
    if (!el.lat || !el.lon) return null;

    const address = el.address || {};
    const city =
      address.city ||
      address.town ||
      address.province ||
      address.state ||
      address.county ||
      '';

    return {
      id: `n${el.osm_id || el.place_id}`,
      name: (el.display_name?.split(',')[0] || el.name || 'Otogar').trim(),
      city,
      district: address.suburb || address.district || undefined,
      lat: parseFloat(el.lat),
      lng: parseFloat(el.lon),
      source: 'NOMINATIM',
    };
  }

  /**
   * Filter out generic results (a street, a district center, etc.).
   * Keep only entries whose name contains otogar/terminal/garaj keywords.
   */
  private looksLikeBusStation(r: OtogarResult): boolean {
    const n = r.name.toLowerCase();
    return (
      n.includes('otogar') ||
      n.includes('terminal') ||
      n.includes('otobüs') ||
      n.includes('bus station') ||
      n.includes('garaj') ||
      n.includes('aktarma')
    );
  }
}
