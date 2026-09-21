import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { WasteController } from './waste.controller.js';
import { WasteService } from './waste.service.js';

@Module({
  imports: [AuthModule],
  controllers: [WasteController],
  providers: [WasteService],
  exports: [WasteService],
})
export class WasteModule {}
