import { Injectable } from '@nestjs/common';

/**
 * Geographic distance utilities. Uses great-circle (Haversine) math on
 * station lat/lng, then applies a road factor to approximate real road
 * distance for intercity routes in Turkey.
 */
@Injectable()
export class LocationService {
  /** Road distance is typically 1.25x–1.4x great-circle for Anatolian terrain. */
  private readonly ROAD_FACTOR = 1.32;
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Great-circle distance between two lat/lng pairs in km.
   * Returns 0 if any coordinate is missing/invalid.
   */
  haversine(
    latA: number | null | undefined,
    lngA: number | null | undefined,
    latB: number | null | undefined,
    lngB: number | null | undefined,
  ): number {
    if (latA == null || lngA == null || latB == null || lngB == null) return 0;
    const a = Number(latA), b = Number(lngA), c = Number(latB), d = Number(lngB);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || !Number.isFinite(d)) return 0;

    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(c - a);
    const dLng = toRad(d - b);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng / 2) ** 2;
    const angle = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return this.EARTH_RADIUS_KM * angle;
  }

  /**
   * Estimated road distance in km between two stations based on GPS coords.
   * Returns null if either coordinate is missing — caller should fall back
   * to the manually-entered route distance.
   */
  estimateRoadDistanceKm(
    latA: number | null | undefined,
    lngA: number | null | undefined,
    latB: number | null | undefined,
    lngB: number | null | undefined,
  ): number | null {
    const gc = this.haversine(latA, lngA, latB, lngB);
    if (gc <= 0) return null;
    return Math.round(gc * this.ROAD_FACTOR);
  }

  /**
   * @deprecated Legacy name placeholder; use estimateRoadDistanceKm with coords.
   * Retained for backward compatibility with older callers.
   */
  calculateDistanceKm(_startLocation: string, _endLocation: string): number {
    return 0;
  }
}
