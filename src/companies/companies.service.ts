import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginatedDto, paginar } from '../common/dto/paginated.dto.js';
import { toBigInt, toNumber } from '../common/utils/serialize.js';
import type { Company, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CompanyEntity,
  CreateCompanyDto,
  QueryCompaniesDto,
  UpdateCompanyDto,
} from './dto/company.dto.js';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryCompaniesDto,
  ): Promise<PaginatedDto<CompanyEntity>> {
    const where: Prisma.CompanyWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { nit: { contains: query.search } },
            { city: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: query.skip,
        take: query.pageSize,
        orderBy: { [query.sortBy ?? 'id']: query.sortDir },
      }),
      this.prisma.company.count({ where }),
    ]);

    return paginar(rows.map(toEntity), total, query.page, query.pageSize);
  }

  async findOne(id: number): Promise<CompanyEntity> {
    const company = await this.prisma.company.findUnique({
      where: { id: toBigInt(id) },
    });

    if (!company) {
      throw new NotFoundException(`No existe la empresa ${id}.`);
    }

    return toEntity(company);
  }

  async create(dto: CreateCompanyDto): Promise<CompanyEntity> {
    return toEntity(await this.prisma.company.create({ data: dto }));
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<CompanyEntity> {
    await this.findOne(id);
    return toEntity(
      await this.prisma.company.update({
        where: { id: toBigInt(id) },
        data: dto,
      }),
    );
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.company.delete({ where: { id: toBigInt(id) } });
  }
}

function toEntity(company: Company): CompanyEntity {
  return { ...company, id: toNumber(company.id) };
}
