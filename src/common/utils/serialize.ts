import type { Prisma } from '../../generated/prisma/client.js';

/**
 * Los ids de la base son `bigint` y los precios `numeric`: ninguno de los dos
 * es serializable a JSON tal cual. Todo lo que sale por la API pasa por aqui.
 */

/** `bigint` -> `number`. Seguro hasta 2^53, de sobra para estos ids. */
export function toNumber(value: bigint): number {
  return Number(value);
}

/** `numeric(12,2)` -> `number`. */
export function toAmount(value: Prisma.Decimal): number {
  return value.toNumber();
}

/** Id de la ruta (`:id`) -> `bigint` para consultar Prisma. */
export function toBigInt(value: number): bigint {
  return BigInt(value);
}
