package com.Votify.backend.factory;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.domain.FeriaInovacionEvento;

public class CreadorFeriaInovacion extends CreadorEvento {

    @Override
    public Evento create(String nombre, String descripcion, String codigoAccesoPublico){

        return new FeriaInovacionEvento(nombre, descripcion, codigoAccesoPublico);

    }
    
}
