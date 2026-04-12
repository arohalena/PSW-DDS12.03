ALTER TABLE public.comentario ALTER COLUMN votacion_proyecto_id DROP NOT NULL;

ALTER TABLE public.comentario ADD COLUMN proyecto_id uuid REFERENCES public.proyecto(id) ON DELETE CASCADE;

ALTER TABLE public.comentario ADD CONSTRAINT comentario_proyecto_or_votacion_check 
    CHECK (proyecto_id IS NOT NULL OR votacion_proyecto_id IS NOT NULL);

    