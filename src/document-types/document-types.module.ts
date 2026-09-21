import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { DocumentTypesController } from './document-types.controller.js';
import { DocumentTypesService } from './document-types.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DocumentTypesController],
  providers: [DocumentTypesService],
  exports: [DocumentTypesService],
})
export class DocumentTypesModule {}
