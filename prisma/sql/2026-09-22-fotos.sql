-- Fotos de sedes y ladrillos.
-- La BD guarda SOLO la ruta del archivo (key en el object storage), nunca los
-- bytes: el archivo vive en Vercel Blob / S3 y el front arma la URL con
-- NEXT_PUBLIC_MEDIA_BASE_URL. Nulo = todavia no hay foto (se pinta el
-- marcador del diseno).

ALTER TABLE brick_yards ADD COLUMN IF NOT EXISTS photo_key TEXT;
ALTER TABLE bricks      ADD COLUMN IF NOT EXISTS photo_key TEXT;

COMMENT ON COLUMN brick_yards.photo_key IS 'Ruta de la foto en el object storage, ej. sedes/porcelana.webp. Nulo si no hay foto.';
COMMENT ON COLUMN bricks.photo_key      IS 'Ruta de la foto en el object storage, ej. ladrillos/bloque-12.webp. Nulo si no hay foto.';
