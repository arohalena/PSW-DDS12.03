ALTER TABLE public.votacion
    ADD COLUMN IF NOT EXISTS resultados_publicados BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fecha_publicacion_resultados TIMESTAMPTZ;