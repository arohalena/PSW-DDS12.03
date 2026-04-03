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