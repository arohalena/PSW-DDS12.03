package com.Votify.backend.factory;

import com.Votify.backend.domain.EventoMO;
import com.Votify.backend.domain.HackathonEvento;

public class CreadorHackathonEvento extends CreadorEvento {
    
    @Override
    public EventoMO create(String nombre, String codigoAccesoPublico){
        
        return new HackathonEvento(nombre, codigoAccesoPublico);

    }
}
