import { Injectable, Logger } from '@nestjs/common';
import { VehiclesService } from '../vehicles/vehicles.service';
import { RoutesService } from '../routes/routes.service';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private vehiclesService: VehiclesService,
    private routesService: RoutesService,
    private tripsService: TripsService,
  ) {}

  /**
   * Suggests a ticket price based on route distance and vehicle fuel consumption.
   * Uses a mock LLM integration.
   */
  async suggestTicketPrice(tenantId: string, routeId: string, vehicleId: string) {
    const route = await this.routesService.findOne(tenantId, routeId);
    const vehicle = await this.vehiclesService.findOne(tenantId, vehicleId);

    const distance = route.totalDistanceKm;
    const consumption = 10; // Mocked: fuelConsumptionPer100km removed from schema

    this.logger.log(`Generating AI price suggestion for Route: ${routeId}, Vehicle: ${vehicleId}`);

    // Mock LLM Prompt Simulation
    const prompt = `
      Route Distance: ${distance} km
      Vehicle Fuel Consumption: ${consumption} L/100km
      Current Fuel Price (Estimated): 40 TRY/L
      Task: Calculate total fuel cost and suggest a ticket price with a 30% profit margin and 20 seats capacity.
    `;

    // Simulate LLM Call Delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulated LLM Response
    const fuelNeeded = (distance * consumption) / 100;
    const fuelCost = fuelNeeded * 40;
    const suggestedTotal = fuelCost * 1.3;
    const recommendedPrice = Math.ceil(suggestedTotal / 20);

    return {
      recommendedPrice,
      currency: 'TRY',
      reasoning: `Based on ${consumption}L/100km consumption over ${distance}km, total fuel cost is ~${fuelCost.toFixed(2)} TRY. With a 30% margin and 20 seats, the recommended price is ${recommendedPrice} TRY.`,
      metadata: {
        distance,
        consumption,
        fuelCostEstimate: fuelCost,
      },
    };
  }

  /**
   * Optimizes a trip route by suggesting detour for extra pickups.
   * Uses a mock LLM integration.
   */
  async optimizeRouteForPickups(tenantId: string, tripId: string) {
    const trip = await this.tripsService.findOne(tenantId, tripId);

    this.logger.log(`Optimizing route for Trip: ${tripId}`);

    // Mocking finding unassigned passengers along the way
    const unassignedCount = Math.floor(Math.random() * 5) + 1;

    // Simulate LLM Call Delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulated LLM Response
    return {
      detourRecommended: true,
      extraDistanceKm: 12.5,
      addedPassengers: unassignedCount,
      newEstimatedTime: 'Adds ~20 minutes to arrival',
      reasoning: `Found ${unassignedCount} passengers near the main highway. A 12.5km detour will increase revenue by ~${unassignedCount * 200} TRY with minimal delay.`,
    };
  }
}
