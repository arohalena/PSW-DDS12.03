ALTER TYPE public.tipo_votacion ADD VALUE IF NOT EXISTS 'MIXTA';

ALTER TABLE public.votacion
    ADD COLUMN IF NOT EXISTS peso_porcentaje_popular INTEGER,
    ADD COLUMN IF NOT EXISTS peso_porcentaje_jurado  INTEGER;