import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { BrickCategoriesController } from './brick-categories.controller.js';
import { BrickCategoriesService } from './brick-categories.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BrickCategoriesController],
  providers: [BrickCategoriesService],
  exports: [BrickCategoriesService],
})
export class BrickCategoriesModule {}
