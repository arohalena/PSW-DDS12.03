package com.Votify.backend.factory;

import java.time.OffsetDateTime;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.domain.HackathonEvento;

public class CreadorHackathonEvento extends CreadorEvento {
    
    @Override
    public Evento create(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, int numProyectosPorVoto, boolean autoVotacion){
        
        return new HackathonEvento(nombre, descripcion, codigoAccesoPublico, fecha_inicio, fecha_fin, numProyectosPorVoto, autoVotacion);

    }
}
