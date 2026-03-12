import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class TripsService implements OnModuleInit {
    private prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    findAll(tenantId: string): Promise<any>;
    create(tenantId: string, dto: any): Promise<any>;
    findOne(tenantId: string, id: string): Promise<any>;
}
