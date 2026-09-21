import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

/** Global: cualquier modulo puede inyectar `PrismaService` sin re-importarlo. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
