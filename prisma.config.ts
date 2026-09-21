import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Configuracion del CLI de Prisma (migrate, introspect, studio).
 *
 * En Prisma 7 las URLs no van en `schema.prisma`. Reparto:
 *
 *   datasource.url  -> solo el CLI. Debe ser la conexion DIRECTA: Migrate abre
 *                      transacciones y sentencias DDL que un pooler
 *                      (PgBouncer de Supabase/Neon, `DATABASE_URL`) rechaza.
 *   runtime         -> `PrismaPg` en `PrismaService`, con `DATABASE_URL`.
 *
 * Sin `DIRECT_URL` (por ejemplo en local, con Postgres sin pooler) cae a
 * `DATABASE_URL`, que ahi es la misma conexion.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
