CREATE TYPE public.modo_ranking AS ENUM ('AUTOMATICO', 'MANUAL');

ALTER TABLE votacion
ADD COLUMN IF NOT EXISTS modo_ranking modo_ranking NOT NULL DEFAULT 'AUTOMATICO';

ALTER TABLE votacion_proyecto
ADD COLUMN IF NOT EXISTS posicion_manual INTEGER;