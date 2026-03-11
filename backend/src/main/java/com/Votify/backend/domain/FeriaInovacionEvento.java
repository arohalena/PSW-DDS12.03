package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEventoMO;

public class FeriaInovacionEvento extends Evento {
    
    public FeriaInovacionEvento(String nombre, String codigoAccesoPublico){

        super(nombre, codigoAccesoPublico);

    }

    @Override
    public TipoEventoMO tipo(){

        return TipoEventoMO.FERIA_INOVACION;
        
    }
}
