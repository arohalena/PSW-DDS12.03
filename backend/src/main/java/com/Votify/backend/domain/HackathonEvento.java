package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEvento;

public class HackathonEvento extends Evento {
    
    public HackathonEvento(String nombre, String codigoAccesoPublico) {

        super(nombre, codigoAccesoPublico);

    }

    @Override
    public TipoEvento tipo(){
        
        return TipoEvento.HACKATHON;

    }
}
