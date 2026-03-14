"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const vehicles_service_1 = require("../vehicles/vehicles.service");
const routes_service_1 = require("../routes/routes.service");
const trips_service_1 = require("../trips/trips.service");
let AiService = AiService_1 = class AiService {
    vehiclesService;
    routesService;
    tripsService;
    logger = new common_1.Logger(AiService_1.name);
    constructor(vehiclesService, routesService, tripsService) {
        this.vehiclesService = vehiclesService;
        this.routesService = routesService;
        this.tripsService = tripsService;
    }
    async suggestTicketPrice(tenantId, routeId, vehicleId) {
        const route = await this.routesService.findOne(tenantId, routeId);
        const vehicle = await this.vehiclesService.findOne(tenantId, vehicleId);
        const distance = route.totalDistanceKm;
        const consumption = 10;
        this.logger.log(`Generating AI price suggestion for Route: ${routeId}, Vehicle: ${vehicleId}`);
        const prompt = `
      Route Distance: ${distance} km
      Vehicle Fuel Consumption: ${consumption} L/100km
      Current Fuel Price (Estimated): 40 TRY/L
      Task: Calculate total fuel cost and suggest a ticket price with a 30% profit margin and 20 seats capacity.
    `;
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
    async optimizeRouteForPickups(tenantId, tripId) {
        const trip = await this.tripsService.findOne(tenantId, tripId);
        this.logger.log(`Optimizing route for Trip: ${tripId}`);
        const unassignedCount = Math.floor(Math.random() * 5) + 1;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return {
            detourRecommended: true,
            extraDistanceKm: 12.5,
            addedPassengers: unassignedCount,
            newEstimatedTime: 'Adds ~20 minutes to arrival',
            reasoning: `Found ${unassignedCount} passengers near the main highway. A 12.5km detour will increase revenue by ~${unassignedCount * 200} TRY with minimal delay.`,
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vehicles_service_1.VehiclesService,
        routes_service_1.RoutesService,
        trips_service_1.TripsService])
], AiService);
//# sourceMappingURL=ai.service.js.map