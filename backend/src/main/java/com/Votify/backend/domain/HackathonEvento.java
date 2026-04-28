package com.Votify.backend.domain;

import java.time.OffsetDateTime;

import com.Votify.backend.model.TipoEventoMO;

public class HackathonEvento extends Evento {
    
    public HackathonEvento(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, int numProyectosPorVoto) {

        super(nombre, descripcion, codigoAccesoPublico, fecha_inicio, fecha_fin, numProyectosPorVoto);

    }

    @Override
    public TipoEventoMO tipo(){
        
        return TipoEventoMO.HACKATHON;

    }
}
