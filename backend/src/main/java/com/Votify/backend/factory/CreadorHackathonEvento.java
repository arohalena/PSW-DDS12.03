package com.Votify.backend.factory;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.domain.HackathonEvento;

public class CreadorHackathonEvento extends CreadorEvento {
    
    @Override
    public Evento create(String nombre, String descripcion, String codigoAccesoPublico){
        
        return new HackathonEvento(nombre, descripcion, codigoAccesoPublico);

    }
}
