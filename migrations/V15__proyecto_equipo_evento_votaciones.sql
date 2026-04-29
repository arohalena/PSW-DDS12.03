ALTER TABLE proyecto
ADD COLUMN IF NOT EXISTS equipo_id UUID;

ALTER TABLE proyecto
ALTER COLUMN evento_id DROP NOT NULL;

UPDATE proyecto p
SET equipo_id = e.id
FROM equipo e
WHERE e.proyecto_id = p.id
AND p.equipo_id IS NULL;

ALTER TABLE proyecto
ADD CONSTRAINT fk_proyecto_equipo
FOREIGN KEY (equipo_id) REFERENCES equipo(id);

ALTER TABLE equipo
ALTER COLUMN proyecto_id DROP NOT NULL;

ALTER TABLE equipo
ALTER COLUMN evento_id DROP NOT NULL;