DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modalidad_votacion') THEN
        CREATE TYPE modalidad_votacion AS ENUM ('SIMPLE', 'MULTICRITERIO');
    END IF;
END $$;

ALTER TABLE public.votacion
ADD COLUMN IF NOT EXISTS modalidad modalidad_votacion;

UPDATE public.votacion
SET modalidad = 'SIMPLE'
WHERE modalidad IS NULL;

ALTER TABLE public.votacion
ALTER COLUMN modalidad SET NOT NULL;

ALTER TABLE public.voto
ADD COLUMN IF NOT EXISTS puntuacion_total numeric(6,2);

CREATE TABLE IF NOT EXISTS public.criterio_evaluacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    votacion_id uuid NOT NULL,
    nombre varchar(255) NOT NULL,
    descripcion text,
    peso numeric(5,2) NOT NULL,
    orden_visual integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT criterio_evaluacion_peso_check CHECK (peso > 0 AND peso <= 100)
);

CREATE TABLE IF NOT EXISTS public.voto_criterio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voto_id uuid NOT NULL,
    criterio_id uuid NOT NULL,
    puntuacion integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT voto_criterio_puntuacion_check CHECK (puntuacion >= 1 AND puntuacion <= 5)
);

ALTER TABLE ONLY public.criterio_evaluacion
    ADD CONSTRAINT criterio_evaluacion_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.voto_criterio
    ADD CONSTRAINT voto_criterio_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.criterio_evaluacion
    ADD CONSTRAINT fk_criterio_votacion
    FOREIGN KEY (votacion_id) REFERENCES public.votacion(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.voto_criterio
    ADD CONSTRAINT fk_voto_criterio_voto
    FOREIGN KEY (voto_id) REFERENCES public.voto(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.voto_criterio
    ADD CONSTRAINT fk_voto_criterio_criterio
    FOREIGN KEY (criterio_id) REFERENCES public.criterio_evaluacion(id) ON DELETE CASCADE;