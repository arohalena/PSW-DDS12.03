-- 1) Limpieza historica del anonimato (ANTES de bloquear UPDATE/DELETE):
--    Cualquier voto cuyo usuario asociado NO sea jurado ni organizador
--    pierde la asociacion (queda anonimo).
UPDATE public.voto v
   SET usuario_id = NULL
  FROM public.usuario u
 WHERE v.usuario_id = u.id
   AND u.rol NOT IN ('JURADO', 'ORGANIZADOR');

CREATE TABLE IF NOT EXISTS public.auditoria_voto (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    voto_id         uuid NOT NULL,
    votacion_id     uuid NOT NULL,
    proyecto_id     uuid NOT NULL,
    anon_token_hash text NOT NULL,
    accion          varchar(16) NOT NULL CHECK (accion IN ('INSERT')),
    ip_hash         varchar(128),
    user_agent_hash varchar(128),
    created_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_voto_votacion
    ON public.auditoria_voto(votacion_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_voto_proyecto
    ON public.auditoria_voto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_voto_voto
    ON public.auditoria_voto(voto_id);

-- 3) Trigger AFTER INSERT que registra cada voto en auditoria
CREATE OR REPLACE FUNCTION public.registrar_auditoria_voto()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_votacion_id uuid;
    v_proyecto_id uuid;
BEGIN
    SELECT vp.votacion_id, vp.proyecto_id
      INTO v_votacion_id, v_proyecto_id
      FROM public.votacion_proyecto vp
     WHERE vp.id = NEW.votacion_proyecto_id;

    INSERT INTO public.auditoria_voto(
        voto_id, votacion_id, proyecto_id,
        anon_token_hash, accion
    ) VALUES (
        NEW.id, v_votacion_id, v_proyecto_id,
        NEW.anon_token_hash, 'INSERT'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auditoria_voto ON public.voto;
CREATE TRIGGER trg_auditoria_voto
AFTER INSERT ON public.voto
FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_voto();

-- 4) Inmutabilidad: bloquear UPDATE y DELETE (DESPUES del UPDATE de limpieza)
CREATE OR REPLACE FUNCTION public.bloquear_modificacion_voto()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Los votos son inmutables: operacion % no permitida en %',
        TG_OP, TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS trg_voto_inmutable ON public.voto;
CREATE TRIGGER trg_voto_inmutable
BEFORE UPDATE OR DELETE ON public.voto
FOR EACH ROW EXECUTE FUNCTION public.bloquear_modificacion_voto();

DROP TRIGGER IF EXISTS trg_voto_criterio_inmutable ON public.voto_criterio;
CREATE TRIGGER trg_voto_criterio_inmutable
BEFORE UPDATE OR DELETE ON public.voto_criterio
FOR EACH ROW EXECUTE FUNCTION public.bloquear_modificacion_voto();

-- 5) Auditoria tambien es append-only
CREATE OR REPLACE FUNCTION public.bloquear_modificacion_auditoria()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'auditoria_voto es append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_auditoria_inmutable ON public.auditoria_voto;
CREATE TRIGGER trg_auditoria_inmutable
BEFORE UPDATE OR DELETE ON public.auditoria_voto
FOR EACH ROW EXECUTE FUNCTION public.bloquear_modificacion_auditoria();