export declare class CreateVehicleDto {
    registrationPlate: string;
    make: string;
    model: string;
    year: number;
    chassisNumber: string;
    capacity: number;
}
export declare class UpdateVehicleDto {
    registrationPlate?: string;
    make?: string;
    model?: string;
    year?: number;
    chassisNumber?: string;
    capacity?: number;
    status?: string;
}
