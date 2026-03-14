import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    suggestPrice(req: any, body: {
        routeId: string;
        vehicleId: string;
    }): Promise<{
        recommendedPrice: number;
        currency: string;
        reasoning: string;
        metadata: {
            distance: number;
            consumption: number;
            fuelCostEstimate: number;
        };
    }>;
    optimizeRoute(req: any, tripId: string): Promise<{
        detourRecommended: boolean;
        extraDistanceKm: number;
        addedPassengers: number;
        newEstimatedTime: string;
        reasoning: string;
    }>;
}
