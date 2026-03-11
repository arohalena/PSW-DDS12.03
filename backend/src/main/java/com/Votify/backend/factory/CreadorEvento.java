package com.Votify.backend.factory;

import com.Votify.backend.domain.Evento;
import java.time.OffsetDateTime;

public abstract class CreadorEvento {
    
    public abstract Evento create(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin);

}
