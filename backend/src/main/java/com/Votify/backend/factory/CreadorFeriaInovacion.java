package com.Votify.backend.factory;

import com.Votify.backend.domain.EventoMO;
import com.Votify.backend.domain.FeriaInovacionEvento;

public class CreadorFeriaInovacion extends CreadorEvento {

    @Override
    public EventoMO create(String nombre, String codigoAccesoPublico){

        return new FeriaInovacionEvento(nombre, codigoAccesoPublico);

    }
    
}
