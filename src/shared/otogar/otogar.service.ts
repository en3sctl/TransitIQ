import { Injectable, Logger } from '@nestjs/common';

export interface OtogarResult {
  id: string;           // OSM node/way id, prefixed with n/w/r
  name: string;
  city: string;
  district?: string;
  lat: number;
  lng: number;
  operator?: string;
  wikipedia?: string;
  source: 'OSM';
}

/**
 * Looks up bus stations (otogar) from OpenStreetMap via Overpass API.
 * Free, no API key. Aggressively cached per-city (in-memory for now).
 *
 * OSM tags used:
 *   amenity=bus_station
 *   public_transport=station (+bus=yes as fallback)
 *
 * Overpass endpoint docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */
@Injectable()
export class OtogarService {
  private readonly logger = new Logger(OtogarService.name);
  private readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
  private readonly USER_AGENT = 'TransitIQ/1.0 (destek@transitiq.com)';
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  private cache = new Map<string, { results: OtogarResult[]; at: number }>();

  /**
   * Search otogar by city name (Turkey-scoped).
   */
  async searchByCity(city: string): Promise<OtogarResult[]> {
    if (!city?.trim()) return [];
    const key = city.trim().toLowerCase();

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < this.CACHE_TTL_MS) {
      return cached.results;
    }

    // Overpass QL: search nodes+ways with amenity=bus_station within the admin area
    // named like the city in Turkey. Uses area lookup by name (Turkish or English).
    const query = `
[out:json][timeout:25];
area["name"~"^${this.escape(city)}$",i]["boundary"="administrative"]["admin_level"~"^(4|6)$"];
(
  node["amenity"="bus_station"](area);
  way["amenity"="bus_station"](area);
  node["public_transport"="station"]["bus"="yes"](area);
);
out center tags 30;
`.trim();

    try {
      const res = await fetch(this.OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) {
        this.logger.warn(`Overpass returned ${res.status} for city=${city}`);
        return [];
      }

      const data: any = await res.json();
      const results: OtogarResult[] = (data.elements || [])
        .map((el: any) => this.normalize(el, city))
        .filter((x: OtogarResult | null): x is OtogarResult => x !== null)
        .filter(
          (x: OtogarResult, i: number, arr: OtogarResult[]) =>
            arr.findIndex((y) => y.name.toLowerCase() === x.name.toLowerCase()) === i,
        );

      this.cache.set(key, { results, at: Date.now() });
      return results;
    } catch (err) {
      this.logger.warn(`Overpass fetch failed for ${city}: ${err}`);
      return [];
    }
  }

  private normalize(el: any, fallbackCity: string): OtogarResult | null {
    const name = el.tags?.name || el.tags?.['name:tr'] || el.tags?.operator;
    if (!name) return null;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) return null;

    const prefix = el.type === 'way' ? 'w' : el.type === 'relation' ? 'r' : 'n';

    return {
      id: `${prefix}${el.id}`,
      name,
      city: el.tags?.['addr:city'] || fallbackCity,
      district: el.tags?.['addr:district'] || undefined,
      lat,
      lng,
      operator: el.tags?.operator,
      wikipedia: el.tags?.wikipedia,
      source: 'OSM',
    };
  }

  private escape(s: string): string {
    return s.replace(/[\\"]/g, '\\$&');
  }
}
