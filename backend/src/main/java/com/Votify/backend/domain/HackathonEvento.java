package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEventoMO;

public class HackathonEvento extends EventoMO {
    
    public HackathonEvento(String nombre, String codigoAccesoPublico) {

        super(nombre, codigoAccesoPublico);

    }

    @Override
    public TipoEventoMO tipo(){
        
        return TipoEventoMO.HACKATHON;

    }
}
