import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module.js';
import { BrickCategoriesModule } from './brick-categories/brick-categories.module.js';
import { BrickYardsModule } from './brick-yards/brick-yards.module.js';
import { BricksModule } from './bricks/bricks.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { DocumentTypesModule } from './document-types/document-types.module.js';
import { HealthModule } from './health/health.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { MaterialsModule } from './materials/materials.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';
import { WasteModule } from './waste/waste.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    DocumentTypesModule,
    CompaniesModule,
    BrickYardsModule,
    BrickCategoriesModule,
    MaterialsModule,
    BricksModule,
    InventoryModule,
    OrdersModule,
    WasteModule,
  ],
})
export class AppModule {}
