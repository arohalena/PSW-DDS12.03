package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEventoMO;

public abstract class EventoMO {
    
    protected String nombre;
    protected String codigoAccesoPublico;

    public EventoMO(String nombre, String codigoAccesoPublico){

        this.nombre = nombre;
        this.codigoAccesoPublico = codigoAccesoPublico;

    }

    public abstract TipoEventoMO tipo();

    public String getNombre() {return nombre;}
    public String getCodigoAccesoPublico() {return codigoAccesoPublico;}

}
