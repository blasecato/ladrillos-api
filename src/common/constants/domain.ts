/** Vocabulario del dominio, en los mismos codigos que guarda la base de datos. */

/** `roles.code` sembrados por defecto. */
export const ROLE_CODES = ['admin', 'seller', 'client'] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

/** `document_types.code`. */
export const DOCUMENT_TYPE_CODES = ['CC', 'CE', 'TI', 'PA', 'NIT'] as const;

/** Valores del enum `order_status`. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_production',
  'delivered',
  'cancelled',
] as const;
export type OrderStatusCode = (typeof ORDER_STATUSES)[number];

/** `inventory_movements.reason`. */
export const MOVEMENT_REASONS = [
  'production',
  'sale',
  'adjustment',
  'waste',
] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

/** `waste_reasons.code` sembrados por la migracion. */
export const WASTE_REASON_CODES = [
  'loading',
  'transport',
  'firing',
  'drying',
  'handling',
  'defect',
  'weather',
  'other',
] as const;
export type WasteReasonCode = (typeof WASTE_REASON_CODES)[number];

/** Umbral por debajo del cual el inventario se reporta como bajo. */
export const LOW_STOCK_THRESHOLD = 3500;
