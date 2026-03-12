import { VehiclesService } from '../vehicles/vehicles.service';
import { RoutesService } from '../routes/routes.service';
import { TripsService } from '../trips/trips.service';
export declare class AiService {
    private vehiclesService;
    private routesService;
    private tripsService;
    private readonly logger;
    constructor(vehiclesService: VehiclesService, routesService: RoutesService, tripsService: TripsService);
    suggestTicketPrice(tenantId: string, routeId: string, vehicleId: string): Promise<{
        recommendedPrice: number;
        currency: string;
        reasoning: string;
        metadata: {
            distance: any;
            consumption: number;
            fuelCostEstimate: number;
        };
    }>;
    optimizeRouteForPickups(tenantId: string, tripId: string): Promise<{
        detourRecommended: boolean;
        extraDistanceKm: number;
        addedPassengers: number;
        newEstimatedTime: string;
        reasoning: string;
    }>;
}
