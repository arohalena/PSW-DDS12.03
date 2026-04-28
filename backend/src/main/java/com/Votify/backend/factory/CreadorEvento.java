package com.Votify.backend.factory;

import java.time.OffsetDateTime;

import com.Votify.backend.domain.Evento;

public abstract class CreadorEvento {
    
    public abstract Evento create(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, int numProyectosPorVoto);

}
