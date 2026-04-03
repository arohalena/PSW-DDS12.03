CREATE TABLE usuario (

    id UUID DEFAULT gen_random_uuid() NOT NULL,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT usuario_pkey PRIMARY KEY (id)
    
);