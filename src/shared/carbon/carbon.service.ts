import { Injectable } from '@nestjs/common';

/**
 * CO2 emission estimator for intercity trips.
 * Sources (public, averaged):
 * - Bus: ~0.027 kg CO2 per passenger-km (intercity coach, occupancy ~70%)
 * - Car: ~0.170 kg CO2 per km (single occupancy, average passenger car)
 * - Plane: ~0.255 kg CO2 per passenger-km (domestic short-haul)
 * - Train (HSR): ~0.041 kg CO2 per passenger-km
 */
@Injectable()
export class CarbonService {
  private readonly BUS_CO2_PER_KM = 0.027;
  private readonly CAR_CO2_PER_KM = 0.170;
  private readonly PLANE_CO2_PER_KM = 0.255;
  private readonly TRAIN_CO2_PER_KM = 0.041;

  calculate(distanceKm: number | null | undefined) {
    const d = Number(distanceKm || 0);
    if (d <= 0) return null;

    const bus = d * this.BUS_CO2_PER_KM;
    const car = d * this.CAR_CO2_PER_KM;
    const plane = d * this.PLANE_CO2_PER_KM;
    const train = d * this.TRAIN_CO2_PER_KM;

    return {
      distanceKm: d,
      bus: Math.round(bus * 100) / 100,
      car: Math.round(car * 100) / 100,
      plane: Math.round(plane * 100) / 100,
      train: Math.round(train * 100) / 100,
      savedVsCar: Math.round((car - bus) * 100) / 100,
      savedVsPlane: Math.round((plane - bus) * 100) / 100,
      percentLessThanCar: Math.round(((car - bus) / car) * 100),
      percentLessThanPlane: Math.round(((plane - bus) / plane) * 100),
      equivalent: this.humanizeEquivalent(bus),
    };
  }

  /**
   * Convert kg CO2 to a relatable analogy.
   */
  private humanizeEquivalent(kgCo2: number): string {
    if (kgCo2 < 1) return `${Math.round(kgCo2 * 1000)}g — bir bardak kahvenin üretimi kadar`;
    if (kgCo2 < 5) return `${Math.round(kgCo2 * 4)} adet plastik poşetin üretimi kadar`;
    if (kgCo2 < 15) return `${Math.round(kgCo2 * 3)} km araba kullanımı kadar`;
    return `${Math.round(kgCo2 / 21)} ağacın yıllık karbon tutumu kadar`;
  }
}
