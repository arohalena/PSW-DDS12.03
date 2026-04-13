CREATE TABLE public.criterio_evaluacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    peso integer NOT NULL,
    escala_min integer DEFAULT 1 NOT NULL,
    escala_max integer DEFAULT 10 NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT criterio_evaluacion_pkey PRIMARY KEY (id),
    CONSTRAINT criterio_evaluacion_evento_fk FOREIGN KEY (evento_id)
        REFERENCES public.evento(id) ON DELETE CASCADE,
    CONSTRAINT criterio_evaluacion_peso_check CHECK (peso > 0 AND peso <= 100),
    CONSTRAINT criterio_evaluacion_escala_check CHECK (escala_min < escala_max)
);

CREATE TABLE public.puntuacion_criterio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    criterio_id uuid NOT NULL,
    votacion_proyecto_id uuid NOT NULL,
    anon_token_hash text NOT NULL,
    puntuacion integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT puntuacion_criterio_pkey PRIMARY KEY (id),
    CONSTRAINT puntuacion_criterio_criterio_fk FOREIGN KEY (criterio_id)
        REFERENCES public.criterio_evaluacion(id) ON DELETE CASCADE,
    CONSTRAINT puntuacion_criterio_vp_fk FOREIGN KEY (votacion_proyecto_id)
        REFERENCES public.votacion_proyecto(id) ON DELETE CASCADE,
    CONSTRAINT puntuacion_criterio_unique
        UNIQUE (criterio_id, votacion_proyecto_id, anon_token_hash)
);
