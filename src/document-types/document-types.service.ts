import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateDocumentTypeDto,
  DocumentTypeEntity,
  UpdateDocumentTypeDto,
} from './dto/document-type.dto.js';

@Injectable()
export class DocumentTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<DocumentTypeEntity[]> {
    return this.prisma.documentType.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number): Promise<DocumentTypeEntity> {
    const documentType = await this.prisma.documentType.findUnique({
      where: { id },
    });

    if (!documentType) {
      throw new NotFoundException(`No existe el tipo de documento ${id}.`);
    }

    return documentType;
  }

  create(dto: CreateDocumentTypeDto): Promise<DocumentTypeEntity> {
    return this.prisma.documentType.create({ data: dto });
  }

  async update(
    id: number,
    dto: UpdateDocumentTypeDto,
  ): Promise<DocumentTypeEntity> {
    await this.findOne(id);
    return this.prisma.documentType.update({ where: { id }, data: dto });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.documentType.delete({ where: { id } });
  }
}
