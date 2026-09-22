-- ===========================================================================
-- Consolidacion de sedes: de nueve inventadas por el seed a las cuatro marcas
-- reales. Orden de ejecucion:
--   1) renombrar las cuatro que se quedan (y cargarles el telefono del brochure)
--   2) crear la que falte, por si el seed de esa BD no la tenia
--   3) volcar inventario e historial de las cinco absorbidas
--   4) borrar las que quedaron vacias
-- Todo va en una transaccion: o entra completo o no entra nada.
-- ===========================================================================

BEGIN;

-- ---------- 1) Las cuatro que se quedan ----------
UPDATE brick_yards
   SET name = 'Porcelana', phone = '318 801 0892', address = 'Vereda Bajo Solarte',
       city = 'Pitalito', department = 'Huila'
 WHERE name = 'Sede Bruselas';
UPDATE brick_yards
   SET name = 'J8', phone = '321 471 0767', address = NULL,
       city = 'Pitalito', department = 'Huila'
 WHERE name = 'Sede Palmarito';
UPDATE brick_yards
   SET name = 'Buenos Aires', phone = '311 717 9274', address = NULL,
       city = 'Pitalito', department = 'Huila'
 WHERE name = 'Sede Chillurco';
UPDATE brick_yards
   SET name = 'Ilapi', phone = '315 715 6014', address = NULL,
       city = 'Pitalito', department = 'Huila'
 WHERE name = 'Sede La Laguna';

-- ---------- 2) Red de seguridad: crear la marca que no haya quedado ----------
-- Si el paso 1 no encontro la sede vieja (otra BD, otro seed), la marca se
-- crea vacia para que los pasos siguientes tengan destino.
INSERT INTO brick_yards (company_id, name, phone, address, city, department)
SELECT (SELECT id FROM companies ORDER BY id LIMIT 1), v.name, v.phone, v.address, 'Pitalito', 'Huila'
  FROM (VALUES
    ('Porcelana',    '318 801 0892', 'Vereda Bajo Solarte'),
    ('J8',           '321 471 0767', NULL),
    ('Buenos Aires', '311 717 9274', NULL),
    ('Ilapi',        '315 715 6014', NULL)
  ) AS v(name, phone, address)
 WHERE NOT EXISTS (SELECT 1 FROM brick_yards b WHERE b.name = v.name);

-- ---------- 3) Las cinco absorbidas ----------
-- Sede Regueros -> Porcelana
-- El inventario se SUMA: su clave primaria es (sede, ladrillo), asi que mover
-- la fila chocaria con la que el destino ya tiene de ese mismo ladrillo.
INSERT INTO inventory (brick_yard_id, brick_id, quantity, updated_at)
SELECT (SELECT id FROM brick_yards WHERE name = 'Porcelana'), i.brick_id, i.quantity, now()
  FROM inventory i
 WHERE i.brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Regueros')
ON CONFLICT (brick_yard_id, brick_id)
DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = now();

DELETE FROM inventory
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Regueros');

-- El historial solo cambia de sede: no hay claves que choquen.
UPDATE order_items         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Porcelana')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Regueros');
UPDATE inventory_movements SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Porcelana')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Regueros');
UPDATE brick_waste         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Porcelana')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Regueros');
-- Sede Centro -> J8
-- El inventario se SUMA: su clave primaria es (sede, ladrillo), asi que mover
-- la fila chocaria con la que el destino ya tiene de ese mismo ladrillo.
INSERT INTO inventory (brick_yard_id, brick_id, quantity, updated_at)
SELECT (SELECT id FROM brick_yards WHERE name = 'J8'), i.brick_id, i.quantity, now()
  FROM inventory i
 WHERE i.brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Centro')
ON CONFLICT (brick_yard_id, brick_id)
DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = now();

DELETE FROM inventory
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Centro');

-- El historial solo cambia de sede: no hay claves que choquen.
UPDATE order_items         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'J8')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Centro');
UPDATE inventory_movements SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'J8')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Centro');
UPDATE brick_waste         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'J8')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Centro');
-- Sede Timana -> Buenos Aires
-- El inventario se SUMA: su clave primaria es (sede, ladrillo), asi que mover
-- la fila chocaria con la que el destino ya tiene de ese mismo ladrillo.
INSERT INTO inventory (brick_yard_id, brick_id, quantity, updated_at)
SELECT (SELECT id FROM brick_yards WHERE name = 'Buenos Aires'), i.brick_id, i.quantity, now()
  FROM inventory i
 WHERE i.brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Timana')
ON CONFLICT (brick_yard_id, brick_id)
DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = now();

DELETE FROM inventory
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Timana');

-- El historial solo cambia de sede: no hay claves que choquen.
UPDATE order_items         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Buenos Aires')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Timana');
UPDATE inventory_movements SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Buenos Aires')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Timana');
UPDATE brick_waste         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Buenos Aires')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Timana');
-- Sede Sur -> Ilapi
-- El inventario se SUMA: su clave primaria es (sede, ladrillo), asi que mover
-- la fila chocaria con la que el destino ya tiene de ese mismo ladrillo.
INSERT INTO inventory (brick_yard_id, brick_id, quantity, updated_at)
SELECT (SELECT id FROM brick_yards WHERE name = 'Ilapi'), i.brick_id, i.quantity, now()
  FROM inventory i
 WHERE i.brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Sur')
ON CONFLICT (brick_yard_id, brick_id)
DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = now();

DELETE FROM inventory
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Sur');

-- El historial solo cambia de sede: no hay claves que choquen.
UPDATE order_items         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Ilapi')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Sur');
UPDATE inventory_movements SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Ilapi')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Sur');
UPDATE brick_waste         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Ilapi')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Sur');
-- Sede Norte -> Porcelana
-- El inventario se SUMA: su clave primaria es (sede, ladrillo), asi que mover
-- la fila chocaria con la que el destino ya tiene de ese mismo ladrillo.
INSERT INTO inventory (brick_yard_id, brick_id, quantity, updated_at)
SELECT (SELECT id FROM brick_yards WHERE name = 'Porcelana'), i.brick_id, i.quantity, now()
  FROM inventory i
 WHERE i.brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Norte')
ON CONFLICT (brick_yard_id, brick_id)
DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = now();

DELETE FROM inventory
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Norte');

-- El historial solo cambia de sede: no hay claves que choquen.
UPDATE order_items         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Porcelana')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Norte');
UPDATE inventory_movements SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Porcelana')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Norte');
UPDATE brick_waste         SET brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Porcelana')
 WHERE brick_yard_id = (SELECT id FROM brick_yards WHERE name = 'Sede Norte');

-- ---------- 4) Borrar las sedes ya vacias ----------
-- Los NOT EXISTS son la red de seguridad: si algo siguiera colgando, no borra.
DELETE FROM brick_yards b
 WHERE b.name NOT IN ('Porcelana', 'J8', 'Buenos Aires', 'Ilapi')
   AND NOT EXISTS (SELECT 1 FROM inventory           t WHERE t.brick_yard_id = b.id)
   AND NOT EXISTS (SELECT 1 FROM order_items         t WHERE t.brick_yard_id = b.id)
   AND NOT EXISTS (SELECT 1 FROM inventory_movements t WHERE t.brick_yard_id = b.id)
   AND NOT EXISTS (SELECT 1 FROM brick_waste         t WHERE t.brick_yard_id = b.id);

-- ---------- Control antes de confirmar ----------
-- Esperado: 4 filas y 384200 en el total (si la BD no ha tenido ventas nuevas).
SELECT y.name, count(*) FILTER (WHERE i.quantity > 0) AS referencias,
       coalesce(sum(i.quantity), 0)::int AS stock
  FROM brick_yards y
  LEFT JOIN inventory i ON i.brick_yard_id = y.id
 GROUP BY y.name
 ORDER BY stock DESC;

COMMIT;
