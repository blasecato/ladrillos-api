import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import type { Type } from '@nestjs/common';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 137 })
  total!: number;

  @ApiProperty({ example: 7 })
  totalPages!: number;
}

/** Sobre de listado: `{ items, meta }`, igual que espera el frontend. */
export class PaginatedDto<TItem> {
  items!: TItem[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export function paginar<TItem>(
  items: TItem[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedDto<TItem> {
  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

/**
 * Decorador de respuesta paginada para Swagger: describe `{ items: TItem[], meta }`
 * sin repetir el esquema en cada controlador.
 */
export function apiPaginatedSchema<TModel extends Type<unknown>>(
  model: TModel,
) {
  return {
    allOf: [
      { $ref: getSchemaPath(PaginatedDto) },
      {
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
        },
      },
    ],
  };
}
