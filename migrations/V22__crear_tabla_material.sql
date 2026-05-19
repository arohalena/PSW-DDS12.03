CREATE TABLE public.material_proyecto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,

    proyecto_id uuid NOT NULL,

    nombre text NOT NULL,
    ruta_fichero text NOT NULL,
    tipo_mime character varying(150),
    extension character varying(20),
    tamanyo bigint,


    created_at timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT material_pkey
        PRIMARY KEY (id),

    CONSTRAINT material_proyecto_proyecto_fk
        FOREIGN KEY (proyecto_id)
        REFERENCES public.proyecto(id)
        ON DELETE CASCADE
);

ALTER TABLE public.material_proyecto
ADD CONSTRAINT material_proyecto_unique_ruta
UNIQUE (proyecto_id, ruta_fichero);

CREATE INDEX idx_material_proyecto_proyecto
ON public.material_proyecto(proyecto_id);