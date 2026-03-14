export declare class CreateRouteDto {
    title: string;
    originStationId: string;
    destinationStationId: string;
    basePrice: number;
    totalDistanceKm?: number;
    taxRate?: number;
}
export declare class UpdateRouteDto {
    title?: string;
    originStationId?: string;
    destinationStationId?: string;
    basePrice?: number;
    taxRate?: number;
}
