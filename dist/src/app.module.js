"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const common_module_1 = require("./common/common.module");
const vehicles_module_1 = require("./vehicles/vehicles.module");
const users_module_1 = require("./users/users.module");
const routes_module_1 = require("./routes/routes.module");
const shared_module_1 = require("./shared/shared.module");
const trips_module_1 = require("./trips/trips.module");
const ai_module_1 = require("./ai/ai.module");
const driver_ops_module_1 = require("./driver-ops/driver-ops.module");
const booking_module_1 = require("./booking/booking.module");
const auth_module_1 = require("./auth/auth.module");
const stations_module_1 = require("./stations/stations.module");
const config_1 = require("@nestjs/config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            auth_module_1.AuthModule,
            common_module_1.CommonModule,
            vehicles_module_1.VehiclesModule,
            users_module_1.UsersModule,
            routes_module_1.RoutesModule,
            shared_module_1.SharedModule,
            trips_module_1.TripsModule,
            ai_module_1.AiModule,
            driver_ops_module_1.DriverOpsModule,
            booking_module_1.BookingModule,
            stations_module_1.StationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map