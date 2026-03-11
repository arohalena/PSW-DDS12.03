package com.Votify.backend.factory;

import com.Votify.backend.domain.EventoMO;

public abstract class CreadorEvento {
    
    public abstract EventoMO create(String nombre, String codigoAccesoPublico);

}
