--
-- PostgreSQL database dump
--

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-03 21:01:46

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it

--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 24579)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 888 (class 1247 OID 24617)
-- Name: estado_votacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_votacion AS ENUM (
    'ABIERTA',
    'CERRADA'
);


--
-- TOC entry 891 (class 1247 OID 24622)
-- Name: estadovotacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estadovotacion AS ENUM (
    'ABIERTA',
    'CERRADA'
);


--
-- TOC entry 894 (class 1247 OID 24628)
-- Name: tipo_votacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_votacion AS ENUM (
    'POPULAR'
);


--
-- TOC entry 897 (class 1247 OID 24632)
-- Name: tipoevento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipoevento AS ENUM (
    'FERIA_INOVACION',
    'HACKATHON'
);

--
-- TOC entry 900 (class 1247 OID 24638)
-- Name: tipovotacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipovotacion AS ENUM (
    'POPULAR'
);

--
-- TOC entry 3362 (class 2605 OID 24641)
-- Name: CAST (public.estadovotacion AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.estadovotacion AS character varying) WITH INOUT AS IMPLICIT;


--
-- TOC entry 3363 (class 2605 OID 24642)
-- Name: CAST (public.tipoevento AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.tipoevento AS character varying) WITH INOUT AS IMPLICIT;


--
-- TOC entry 3364 (class 2605 OID 24643)
-- Name: CAST (public.tipovotacion AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.tipovotacion AS character varying) WITH INOUT AS IMPLICIT;


--
-- TOC entry 3280 (class 2605 OID 24644)
-- Name: CAST (character varying AS public.estadovotacion); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.estadovotacion) WITH INOUT AS IMPLICIT;


--
-- TOC entry 3281 (class 2605 OID 24645)
-- Name: CAST (character varying AS public.tipoevento); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.tipoevento) WITH INOUT AS IMPLICIT;


--
-- TOC entry 3282 (class 2605 OID 24646)
-- Name: CAST (character varying AS public.tipovotacion); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.tipovotacion) WITH INOUT AS IMPLICIT;


--
-- TOC entry 263 (class 1255 OID 24647)
-- Name: validar_max_selecciones(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_max_selecciones() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_max_selecciones INT;
        v_votacion_id     UUID;
        v_count           INT;
    BEGIN
        SELECT vp.votacion_id, v.max_selecciones
        INTO v_votacion_id, v_max_selecciones
        FROM votacion_proyecto vp
        JOIN votacion v ON v.id = vp.votacion_id
        WHERE vp.id = NEW.votacion_proyecto_id;

        SELECT COUNT(*)
        INTO v_count
        FROM voto vo
        JOIN votacion_proyecto vp ON vp.id = vo.votacion_proyecto_id
        WHERE vp.votacion_id = v_votacion_id
        AND vo.anon_token_hash = NEW.anon_token_hash;

        IF v_count >= v_max_selecciones THEN
            RAISE EXCEPTION 'El token ya ha alcanzado el maximo de % selecciones para esta votacion', v_max_selecciones;
        END IF;

        RETURN NEW;
    END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 24648)
-- Name: comentario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comentario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    votacion_proyecto_id uuid NOT NULL,
    anon_token_hash character varying(255) NOT NULL,
    texto character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 24736)
-- Name: competidor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    contrasenya text NOT NULL,
    equipo_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- TOC entry 225 (class 1259 OID 24722)
-- Name: equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    proyecto_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 24655)
-- Name: evento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    codigo_acceso_publico character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tipo_evento character varying(32) NOT NULL,
    fecha_fin timestamp with time zone NOT NULL,
    fecha_inicio timestamp with time zone NOT NULL,
    descripcion text NOT NULL,
    CONSTRAINT evento_tipo_evento_chk CHECK (((tipo_evento)::text = ANY (ARRAY[('HACKATHON'::character varying)::text, ('FERIA_INOVACION'::character varying)::text]))),
    CONSTRAINT tiempos_de_eventos_chk CHECK ((fecha_inicio < fecha_fin))
);


--
-- TOC entry 218 (class 1259 OID 24663)
-- Name: evento_organizador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evento_organizador (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    organizador_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 24668)
-- Name: organizador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizador (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 24675)
-- Name: proyecto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proyecto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tipo_proyecto character varying(32) NOT NULL,
    CONSTRAINT proyecto_tipo_proyecto_chk CHECK (((tipo_proyecto)::text = ANY (ARRAY[('IA'::character varying)::text, ('SOSTENIBILIDAD'::character varying)::text])))
);


--
-- TOC entry 221 (class 1259 OID 24683)
-- Name: votacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.votacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id uuid NOT NULL,
    tipo public.tipo_votacion DEFAULT 'POPULAR'::public.tipo_votacion NOT NULL,
    max_selecciones integer NOT NULL,
    inicio timestamp with time zone,
    fin timestamp with time zone,
    estado public.estado_votacion DEFAULT 'CERRADA'::public.estado_votacion NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_fechas CHECK (((fin IS NULL) OR (inicio IS NULL) OR (fin > inicio))),
    CONSTRAINT votacion_max_selecciones_check CHECK ((max_selecciones > 0))
);



--
-- TOC entry 222 (class 1259 OID 24692)
-- Name: votacion_proyecto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.votacion_proyecto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    votacion_id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 223 (class 1259 OID 24697)
-- Name: voto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    votacion_proyecto_id uuid NOT NULL,
    anon_token_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 224 (class 1259 OID 24704)
-- Name: ranking_votacion; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ranking_votacion AS
 SELECT v.id AS votacion_id,
    e.nombre AS evento,
    p.id AS proyecto_id,
    p.nombre AS proyecto,
    count(vo.id) AS total_votos
   FROM ((((public.votacion v
     JOIN public.evento e ON ((e.id = v.evento_id)))
     JOIN public.votacion_proyecto vp ON ((vp.votacion_id = v.id)))
     JOIN public.proyecto p ON ((p.id = vp.proyecto_id)))
     LEFT JOIN public.voto vo ON ((vo.votacion_proyecto_id = vp.id)))
  GROUP BY v.id, e.nombre, p.id, p.nombre
  ORDER BY v.id, (count(vo.id)) DESC;



--
-- TOC entry 3397 (class 2606 OID 24748)
-- Name: competidor competidor_contrasenya_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competidor
    ADD CONSTRAINT competidor_contrasenya_key UNIQUE (contrasenya);


--
-- TOC entry 3399 (class 2606 OID 24746)
-- Name: competidor competidor_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competidor
    ADD CONSTRAINT competidor_email_key UNIQUE (email);


--
-- TOC entry 3401 (class 2606 OID 24744)
-- Name: competidor competidor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competidor
    ADD CONSTRAINT competidor_pkey PRIMARY KEY (id);


--
-- TOC entry 3395 (class 2606 OID 24730)
-- Name: equipo equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_pkey PRIMARY KEY (id);


--
-- TOC entry 3393 (class 2606 OID 24721)
-- Name: proyecto proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT proyecto_pkey PRIMARY KEY (id);


--
-- TOC entry 3403 (class 2606 OID 24749)
-- Name: competidor competidor_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competidor
    ADD CONSTRAINT competidor_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipo(id) ON DELETE SET NULL;


--
-- TOC entry 3402 (class 2606 OID 24731)
-- Name: equipo equipo_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE SET NULL;


-- Completed on 2026-04-03 21:01:46

--
-- PostgreSQL database dump complete
--


