import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { BrickYardsController } from './brick-yards.controller.js';
import { BrickYardsService } from './brick-yards.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BrickYardsController],
  providers: [BrickYardsService],
  exports: [BrickYardsService],
})
export class BrickYardsModule {}
