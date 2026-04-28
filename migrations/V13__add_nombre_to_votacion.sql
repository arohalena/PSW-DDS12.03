ALTER TABLE votacion
ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);

UPDATE votacion
SET nombre = CONCAT(tipo, ' · ', modalidad)
WHERE nombre IS NULL;

ALTER TABLE votacion
ALTER COLUMN nombre SET NOT NULL;