package com.Votify.backend.factory;

import com.Votify.backend.domain.Evento;

public abstract class CreadorEvento {
    
    public abstract Evento create(String nombre, String codigoAccesoPublico);

}
