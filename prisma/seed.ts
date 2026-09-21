import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

import {
  PrismaClient,
  type Brick,
  type BrickYard,
} from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DOCUMENT_TYPES = [
  { code: 'CC', name: 'Cedula de ciudadania' },
  { code: 'CE', name: 'Cedula de extranjeria' },
  { code: 'TI', name: 'Tarjeta de identidad' },
  { code: 'PA', name: 'Pasaporte' },
  { code: 'NIT', name: 'NIT' },
];

const ROLES = [
  { code: 'admin', name: 'Administrador' },
  { code: 'seller', name: 'Vendedor' },
  { code: 'client', name: 'Cliente' },
];

const CATEGORIES = [
  'Cara vista',
  'Estructural',
  'Decorativo',
  'Aislante',
  'Sostenible',
];

// Mismos motivos que siembra la migracion `add_brick_waste`.
const WASTE_REASONS = [
  { code: 'loading', name: 'Dano en cargue' },
  { code: 'transport', name: 'Dano en transporte' },
  { code: 'firing', name: 'Dano en quema/horneado' },
  { code: 'drying', name: 'Dano en secado' },
  { code: 'handling', name: 'Dano en manipulacion o almacenamiento' },
  { code: 'defect', name: 'Defecto de fabricacion' },
  { code: 'weather', name: 'Dano por clima' },
  { code: 'other', name: 'Otro' },
];

const MATERIALS = [
  'Arcilla',
  'Cemento',
  'Concreto',
  'Arcilla reciclada',
  'Silico-calcareo',
];

const BRICK_YARDS = [
  {
    name: 'Sede Norte',
    address: 'Km 3 via Bruselas',
    city: 'Pitalito',
    department: 'Huila',
    phone: '608 836 1120',
    email: 'norte@ladrilleras.com',
  },
  {
    name: 'Sede Sur',
    address: 'Km 5 via Palestina',
    city: 'Pitalito',
    department: 'Huila',
    phone: '608 836 2244',
    email: 'sur@ladrilleras.com',
  },
  {
    name: 'Sede Timana',
    address: 'Via principal',
    city: 'Timana',
    department: 'Huila',
    phone: '608 837 3311',
    email: 'timana@ladrilleras.com',
  },
];

const BRICKS = [
  {
    name: 'Ladrillo cara vista rojo',
    category: 'Cara vista',
    material: 'Arcilla',
    unitPrice: 1450,
  },
  {
    name: 'Bloque estructural n.6',
    category: 'Estructural',
    material: 'Arcilla',
    unitPrice: 2100,
  },
  {
    name: 'Ladrillo decorativo texturizado',
    category: 'Decorativo',
    material: 'Arcilla',
    unitPrice: 1980,
  },
  {
    name: 'Ladrillo aislante termico',
    category: 'Aislante',
    material: 'Concreto',
    unitPrice: 2450,
  },
  {
    name: 'Ladrillo sostenible reciclado',
    category: 'Sostenible',
    material: 'Arcilla reciclada',
    unitPrice: 1320,
  },
];

const USERS = [
  {
    documentNumber: '1017234567',
    fullName: 'Maria Restrepo',
    email: 'maria@ladrilleras.com',
    username: 'maria.restrepo',
    birthDate: '1990-04-18',
    role: 'admin',
  },
  {
    documentNumber: '1075342211',
    fullName: 'Sebastian Ruiz',
    email: 'sebastian@ladrilleras.com',
    username: 'sebastian.ruiz',
    birthDate: '1994-09-02',
    role: 'seller',
  },
  {
    documentNumber: '1083119904',
    fullName: 'Paula Herrera',
    email: 'paula@correo.com',
    username: 'paula.herrera',
    birthDate: '1998-01-25',
    role: 'client',
  },
];

async function main(): Promise<void> {
  for (const documentType of DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { code: documentType.code },
      create: documentType,
      update: { name: documentType.name },
    });
  }

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: role,
      update: { name: role.name },
    });
  }

  for (const name of CATEGORIES) {
    await prisma.brickCategory.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  for (const name of MATERIALS) {
    await prisma.material.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  for (const reason of WASTE_REASONS) {
    await prisma.wasteReason.upsert({
      where: { code: reason.code },
      create: reason,
      update: { name: reason.name },
    });
  }

  const company =
    (await prisma.company.findFirst({ where: { nit: '900123456-7' } })) ??
    (await prisma.company.create({
      data: {
        name: 'Ladrilleras Pitalito SAS',
        nit: '900123456-7',
        email: 'contacto@ladrilleras.com',
        phone: '608 836 0000',
        address: 'Cra 4 #10-25',
        city: 'Pitalito',
      },
    }));

  const yards: BrickYard[] = [];
  for (const yard of BRICK_YARDS) {
    const existente = await prisma.brickYard.findFirst({
      where: { name: yard.name },
    });

    yards.push(
      existente ??
        (await prisma.brickYard.create({
          data: { ...yard, companyId: company.id },
        })),
    );
  }

  const bricks: Brick[] = [];
  for (const brick of BRICKS) {
    const existente = await prisma.brick.findFirst({
      where: { name: brick.name },
    });

    if (existente) {
      bricks.push(existente);
      continue;
    }

    const category = await prisma.brickCategory.findUnique({
      where: { name: brick.category },
    });
    const material = await prisma.material.findUnique({
      where: { name: brick.material },
    });

    bricks.push(
      await prisma.brick.create({
        data: {
          name: brick.name,
          categoryId: category?.id,
          materialId: material?.id,
          unitPrice: brick.unitPrice,
        },
      }),
    );
  }

  // Existencias pseudo-aleatorias pero estables entre corridas.
  for (const brick of bricks) {
    for (const yard of yards) {
      const quantity =
        ((Number(brick.id) * 7 + Number(yard.id) * 13) % 9) * 1500 + 800;

      await prisma.inventory.upsert({
        where: {
          brickYardId_brickId: { brickYardId: yard.id, brickId: brick.id },
        },
        create: { brickYardId: yard.id, brickId: brick.id, quantity },
        update: { quantity },
      });
    }
  }

  const passwordHash = await bcrypt.hash('Ladrillo2026', 10);
  const cc = await prisma.documentType.findUniqueOrThrow({
    where: { code: 'CC' },
  });

  for (const user of USERS) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: user.role },
    });

    const creado = await prisma.user.upsert({
      where: { username: user.username },
      create: {
        documentTypeId: cc.id,
        documentNumber: user.documentNumber,
        fullName: user.fullName,
        email: user.email,
        birthDate: new Date(user.birthDate),
        username: user.username,
        passwordHash,
      },
      update: { passwordHash },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: creado.id, roleId: role.id } },
      create: { userId: creado.id, roleId: role.id },
      update: {},
    });
  }

  console.log(
    'Semilla lista: lookups, empresa, sedes, ladrillos, inventario y usuarios.',
  );
  console.log('Login de prueba: maria.restrepo / Ladrillo2026 (rol admin)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
