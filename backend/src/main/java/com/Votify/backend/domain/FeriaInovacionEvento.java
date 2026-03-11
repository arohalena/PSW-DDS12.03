package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEvento;

public class FeriaInovacionEvento extends Evento {
    
    public FeriaInovacionEvento(String nombre, String descripcion, String codigoAccesoPublico){

        super(nombre, descripcion, codigoAccesoPublico);

    }

    @Override
    public TipoEvento tipo(){

        return TipoEvento.FERIA_INOVACION;
        
    }
}
