-- Fotos de los 18 ladrillos del brochure.
-- Requiere haber corrido antes 2026-09-22-fotos.sql (columna bricks.photo_key).
--
-- Los archivos viven en el front (ladrillera/public/assets/ladrillos/) y la
-- BD guarda solo la ruta. Empieza con "/" => Next la sirve tal cual y
-- NEXT_PUBLIC_MEDIA_BASE_URL no hace falta.
--
-- El cruce va por NOMBRE, no por id, para que sirva igual en local y en Neon
-- aunque las secuencias no coincidan.

UPDATE bricks AS b
SET photo_key = v.photo_key
FROM (VALUES
  ('Bloque #4 rayado',        '/assets/ladrillos/bloque-4-rayado.jpeg'),
  ('Bloque #5 rayado',        '/assets/ladrillos/bloque-5-rayado.jpeg'),
  ('Bloque #4 liso',          '/assets/ladrillos/bloque-4-liso.jpeg'),
  ('Bloque #5 liso',          '/assets/ladrillos/bloque-5-liso.jpeg'),
  ('Bloque #3 - 3 huecos',    '/assets/ladrillos/bloque-3-3-huecos.jpeg'),
  ('Chapeta #3 - 6 huecos',   '/assets/ladrillos/chapeta-3-6-huecos.jpeg'),
  ('Estructural #2 A',        '/assets/ladrillos/estructural-2a.jpeg'),
  ('Estructural #2',          '/assets/ladrillos/estructural-2.jpeg'),
  ('Estructural #5',          '/assets/ladrillos/estructural-5.jpeg'),
  ('Ladrillo estructural #5', '/assets/ladrillos/ladrillo-estructural-5.jpeg'),
  ('Rejilla',                 '/assets/ladrillos/rejilla.jpeg'),
  ('Rejilla estructural',     '/assets/ladrillos/rejilla-estructural.jpeg'),
  ('Adoquín',                 '/assets/ladrillos/adoquin.jpeg'),
  ('Adoquín 8',               '/assets/ladrillos/adoquin-8.jpeg'),
  ('Cuadro',                  '/assets/ladrillos/cuadro.jpeg'),
  ('Tableta',                 '/assets/ladrillos/tableta.jpeg'),
  ('Trébol',                  '/assets/ladrillos/trebol.jpeg'),
  ('Flor',                    '/assets/ladrillos/flor.jpeg')
) AS v(name, photo_key)
WHERE b.name = v.name;

-- Control: deben salir 18 filas con foto y 0 sin foto.
SELECT count(*) FILTER (WHERE photo_key IS NOT NULL) AS con_foto,
       count(*) FILTER (WHERE photo_key IS NULL)     AS sin_foto
FROM bricks;
