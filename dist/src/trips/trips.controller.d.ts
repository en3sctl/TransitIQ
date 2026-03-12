import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/trip.dto';
export declare class TripsController {
    private readonly tripsService;
    constructor(tripsService: TripsService);
    findAll(req: any): Promise<any>;
    create(req: any, createTripDto: CreateTripDto): Promise<any>;
}
