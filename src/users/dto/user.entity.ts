import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { toNumber } from '../../common/utils/serialize.js';
import type { Prisma } from '../../generated/prisma/client.js';

/** Include minimo para armar un `UserEntity`. */
export const USER_INCLUDE = {
  documentType: true,
  userRoles: { include: { role: true } },
} as const;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

export class UserRoleDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'client' })
  code!: string;

  @ApiProperty({ example: 'Cliente' })
  name!: string;
}

/** Usuario tal como sale de la API: nunca lleva `password_hash`. */
export class UserEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  documentTypeId!: number;

  @ApiProperty({ example: 'CC' })
  documentTypeCode!: string;

  @ApiProperty({ example: '1017234567' })
  documentNumber!: string;

  @ApiProperty({ example: 'Maria Restrepo' })
  fullName!: string;

  @ApiProperty({ example: 'maria@correo.com' })
  email!: string;

  @ApiProperty({ type: String, format: 'date', example: '1996-04-18' })
  birthDate!: string;

  @ApiProperty({
    example: 30,
    description: 'Derivada de birthDate, como la vista users_with_age',
  })
  age!: number;

  @ApiProperty({ example: 'maria.restrepo' })
  username!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Id del usuario en Keycloak',
  })
  keycloakId!: string | null;

  @ApiProperty({ type: [UserRoleDto] })
  roles!: UserRoleDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Edad cumplida a dia de hoy. */
export function calcularEdad(birthDate: Date): number {
  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - birthDate.getUTCFullYear();
  const mes = hoy.getUTCMonth() - birthDate.getUTCMonth();

  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < birthDate.getUTCDate())) {
    edad -= 1;
  }

  return edad;
}

export function toUserEntity(user: UserWithRelations): UserEntity {
  return {
    id: toNumber(user.id),
    documentTypeId: user.documentTypeId,
    documentTypeCode: user.documentType.code,
    documentNumber: user.documentNumber,
    fullName: user.fullName,
    email: user.email,
    birthDate: user.birthDate.toISOString().slice(0, 10),
    age: calcularEdad(user.birthDate),
    username: user.username,
    keycloakId: user.keycloakId,
    roles: user.userRoles.map(({ role }) => ({
      id: role.id,
      code: role.code,
      name: role.name,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
