import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { PricingService } from '../shared/pricing/pricing.service';
import { LocationService } from '../shared/location/location.service';
export declare class RoutesService {
    private prisma;
    private pricingService;
    private locationService;
    constructor(prisma: PrismaService, pricingService: PricingService, locationService: LocationService);
    create(tenantId: string, createRouteDto: CreateRouteDto): Promise<any>;
    findAll(tenantId: string): Promise<any>;
    findOne(tenantId: string, id: string): Promise<any>;
    update(tenantId: string, id: string, updateRouteDto: UpdateRouteDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
}
