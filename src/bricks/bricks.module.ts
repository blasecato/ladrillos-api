import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { BricksController } from './bricks.controller.js';
import { BricksService } from './bricks.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BricksController],
  providers: [BricksService],
  exports: [BricksService],
})
export class BricksModule {}
