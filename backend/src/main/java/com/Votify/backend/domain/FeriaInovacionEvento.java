package com.Votify.backend.domain;

import java.time.OffsetDateTime;

import com.Votify.backend.model.TipoEventoMO;

public class FeriaInovacionEvento extends Evento {
    
    public FeriaInovacionEvento(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, int numProyectosPorVoto, boolean autoVotacion){

        super(nombre, descripcion, codigoAccesoPublico, fecha_inicio, fecha_fin, numProyectosPorVoto, autoVotacion);

    }

    @Override
    public TipoEventoMO tipo(){

        return TipoEventoMO.FERIA_INOVACION;
        
    }
}
