-- Revertir V20: deshabilitar RLS en todas las tablas de 'public'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename
          FROM pg_tables
         WHERE schemaname = 'public'
           AND tablename NOT IN ('flyway_schema_history')
    LOOP
        EXECUTE format(
            'ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY;',
            r.schemaname, r.tablename
        );
    END LOOP;
END $$;

-- Restaurar privilegios revocados a los roles publicos de Supabase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA public TO anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated';
    END IF;
END $$;