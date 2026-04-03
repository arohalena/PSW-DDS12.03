ALTER TABLE evento ADD CONSTRAINT evento_pkey PRIMARY KEY (id);
ALTER TABLE comentario ADD CONSTRAINT comentario_pkey PRIMARY KEY (id);
ALTER TABLE evento_organizador ADD CONSTRAINT evento_organizador_pkey PRIMARY KEY (id);
ALTER TABLE organizador ADD CONSTRAINT organizador_pkey PRIMARY KEY (id);
ALTER TABLE votacion ADD CONSTRAINT votacion_pkey PRIMARY KEY (id);
ALTER TABLE votacion_proyecto ADD CONSTRAINT votacion_proyecto_pkey PRIMARY KEY (id);
ALTER TABLE voto ADD CONSTRAINT voto_pkey PRIMARY KEY (id);

CREATE TABLE competidor_evento (

    id UUID DEFAULT gen_random_uuid() NOT NULL,
    competidor_id UUID NOT NULL,
    evento_id UUID NOT NULL,
    equipo_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    CONSTRAINT competidor_evento_pkey PRIMARY KEY (id),
    CONSTRAINT competidor_evento_competidor_id_fkey FOREIGN KEY (competidor_id) REFERENCES competidor (id),
    CONSTRAINT competidor_evento_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES evento(id),
    CONSTRAINT competidor_evento_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES equipo(id),
    CONSTRAINT competidor_evento_unique UNIQUE (competidor_id, evento_id)

);

ALTER TABLE equipo ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES evento(id);