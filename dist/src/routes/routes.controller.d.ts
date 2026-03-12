import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
export declare class RoutesController {
    private readonly routesService;
    constructor(routesService: RoutesService);
    create(req: any, createRouteDto: CreateRouteDto): Promise<any>;
    findAll(req: any): Promise<any>;
    findOne(req: any, id: string): Promise<any>;
    update(req: any, id: string, updateRouteDto: UpdateRouteDto): Promise<any>;
    remove(req: any, id: string): Promise<any>;
}
