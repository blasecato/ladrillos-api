import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Datos de demostracion para las vistas de ventas.
 *
 * Crea ordenes repartidas en los ultimos meses, atribuidas a vendedores, al
 * administrador o sin vendedor (venta directa), y replica exactamente lo que
 * hace `OrdersService.create`: descuenta el inventario de la sede y escribe el
 * movimiento en el libro. Sin eso las existencias quedarian mintiendo.
 *
 *   npx tsx prisma/seed-ventas.ts [cantidad]
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/** Ordenes a crear. Se puede pasar otra cantidad por argumento. */
const CANTIDAD = Number(process.argv[2]) || 45;

/** Ventana de fechas: ultimos 6 meses. */
const DIAS_ATRAS = 180;

/** Estados con su peso: la mayoria de las ventas terminan entregadas. */
const ESTADOS = [
  ...Array<string>(9).fill('delivered'),
  ...Array<string>(4).fill('confirmed'),
  ...Array<string>(3).fill('in_production'),
  ...Array<string>(3).fill('pending'),
  'cancelled',
] as const;

function alAzar<T>(lista: readonly T[]): T {
  return lista[Math.floor(Math.random() * lista.length)]!;
}

function enteroEntre(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Fecha al azar dentro de la ventana, con hora de oficina. */
function fechaAlAzar(): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - enteroEntre(0, DIAS_ATRAS));
  fecha.setHours(enteroEntre(8, 17), enteroEntre(0, 59), 0, 0);
  return fecha;
}

async function usuariosConRol(code: string) {
  return prisma.user.findMany({
    where: { userRoles: { some: { role: { code } } } },
    select: { id: true, fullName: true },
  });
}

async function main(): Promise<void> {
  const [clientes, vendedores, admins] = await Promise.all([
    usuariosConRol('client'),
    usuariosConRol('seller'),
    usuariosConRol('admin'),
  ]);

  if (clientes.length === 0) {
    throw new Error('No hay usuarios con rol `client`: no se pueden crear ordenes.');
  }

  const bricks = await prisma.brick.findMany({
    select: { id: true, unitPrice: true },
  });
  const brickPorId = new Map(bricks.map((brick) => [brick.id, brick.unitPrice]));

  // Se trabaja sobre una foto del inventario para no pedir existencias que
  // otra orden de este mismo seed ya consumio.
  const existencias = await prisma.inventory.findMany({
    where: { quantity: { gt: 0 } },
    select: { brickYardId: true, brickId: true, quantity: true },
  });

  const stock = new Map(
    existencias.map((fila) => [
      `${fila.brickYardId}:${fila.brickId}`,
      fila.quantity,
    ]),
  );

  let creadas = 0;
  let conVendedor = 0;
  let porAdmin = 0;
  let directas = 0;
  let canceladas = 0;

  for (let i = 0; i < CANTIDAD; i += 1) {
    const cliente = alAzar(clientes);
    const dado = Math.random();

    // 65% vendedor, 15% administrador, 20% venta directa sin vendedor.
    const vendedor =
      dado < 0.65 && vendedores.length > 0
        ? alAzar(vendedores)
        : dado < 0.8 && admins.length > 0
          ? alAzar(admins)
          : null;

    const estado = alAzar(ESTADOS);
    const fecha = fechaAlAzar();

    // 1 a 3 lineas, cada una de una combinacion sede+ladrillo con stock.
    const lineas: Array<{ brickYardId: bigint; brickId: bigint; quantity: number }> =
      [];
    const usadas = new Set<string>();

    for (let linea = 0; linea < enteroEntre(1, 3); linea += 1) {
      const disponibles = [...stock.entries()].filter(
        ([clave, cantidad]) => cantidad >= 200 && !usadas.has(clave),
      );

      if (disponibles.length === 0) break;

      const [clave, disponible] = alAzar(disponibles);
      const [yardId, brickId] = clave.split(':').map((parte) => BigInt(parte));

      // Multiplos de 50, sin pasarse de lo que hay.
      const tope = Math.min(1200, Math.floor(disponible / 2));
      const cantidad = Math.max(50, Math.floor(enteroEntre(100, tope) / 50) * 50);

      usadas.add(clave);
      lineas.push({ brickYardId: yardId!, brickId: brickId!, quantity: cantidad });
      stock.set(clave, disponible - cantidad);
    }

    if (lineas.length === 0) {
      console.warn('Sin existencias suficientes: se corta el seed.');
      break;
    }

    await prisma.$transaction(async (tx) => {
      const orden = await tx.order.create({
        data: {
          userId: cliente.id,
          ...(vendedor ? { sellerId: vendedor.id } : {}),
          status: estado as never,
          orderDate: fecha,
          createdAt: fecha,
        },
      });

      for (const linea of lineas) {
        await tx.orderItem.create({
          data: {
            orderId: orden.id,
            brickYardId: linea.brickYardId,
            brickId: linea.brickId,
            quantity: linea.quantity,
            unitPrice: brickPorId.get(linea.brickId) ?? 0,
          },
        });

        await tx.inventory.update({
          where: {
            brickYardId_brickId: {
              brickYardId: linea.brickYardId,
              brickId: linea.brickId,
            },
          },
          data: { quantity: { decrement: linea.quantity }, updatedAt: fecha },
        });

        await tx.inventoryMovement.create({
          data: {
            brickYardId: linea.brickYardId,
            brickId: linea.brickId,
            change: -linea.quantity,
            reason: 'sale',
            orderId: orden.id,
            ...(vendedor ? { createdBy: vendedor.id } : {}),
            createdAt: fecha,
          },
        });

        // Una orden cancelada devolvio su mercancia: se refleja igual que en
        // el flujo real, con su movimiento de ajuste.
        if (estado === 'cancelled') {
          await tx.inventory.update({
            where: {
              brickYardId_brickId: {
                brickYardId: linea.brickYardId,
                brickId: linea.brickId,
              },
            },
            data: { quantity: { increment: linea.quantity }, updatedAt: fecha },
          });

          await tx.inventoryMovement.create({
            data: {
              brickYardId: linea.brickYardId,
              brickId: linea.brickId,
              change: linea.quantity,
              reason: 'adjustment',
              orderId: orden.id,
              createdAt: fecha,
            },
          });
        }
      }
    });

    if (estado === 'cancelled') {
      canceladas += 1;
      // Lo devuelto vuelve a estar disponible para las siguientes ordenes.
      for (const linea of lineas) {
        const clave = `${linea.brickYardId}:${linea.brickId}`;
        stock.set(clave, (stock.get(clave) ?? 0) + linea.quantity);
      }
    }

    creadas += 1;
    if (!vendedor) directas += 1;
    else if (admins.some((admin) => admin.id === vendedor.id)) porAdmin += 1;
    else conVendedor += 1;
  }

  console.log(
    [
      `Ordenes creadas: ${creadas}`,
      `  por vendedores: ${conVendedor}`,
      `  por administrador: ${porAdmin}`,
      `  ventas directas: ${directas}`,
      `  canceladas: ${canceladas}`,
    ].join('\n'),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
