ALTER TYPE public.tipo_votacion ADD VALUE IF NOT EXISTS 'JURADO';

ALTER TYPE public.modalidad_votacion ADD VALUE IF NOT EXISTS 'PUNTOS';
ALTER TYPE public.modalidad_votacion ADD VALUE IF NOT EXISTS 'MULTICRITERIO_PONDERADA';

ALTER TABLE public.comentario
ADD COLUMN IF NOT EXISTS criterio_id uuid REFERENCES public.criterio_evaluacion(id) ON DELETE CASCADE;

ALTER TABLE public.voto
ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES public.usuario(id) ON DELETE SET NULL;