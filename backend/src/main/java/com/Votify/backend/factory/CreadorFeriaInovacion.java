package com.Votify.backend.factory;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.domain.FeriaInovacionEvento;
import java.time.OffsetDateTime;

public class CreadorFeriaInovacion extends CreadorEvento {

    @Override
    public Evento create(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, int numProyectosPorVoto){

        return new FeriaInovacionEvento(nombre, descripcion, codigoAccesoPublico, fecha_inicio, fecha_fin, numProyectosPorVoto);

    }
    
}
