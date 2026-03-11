package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEventoMO;

public abstract class Evento {
    
    protected String nombre;
    protected String codigoAccesoPublico;

    public Evento(String nombre, String codigoAccesoPublico){

        this.nombre = nombre;
        this.codigoAccesoPublico = codigoAccesoPublico;

    }

    public abstract TipoEventoMO tipo();

    public String getNombre() {return nombre;}
    public String getCodigoAccesoPublico() {return codigoAccesoPublico;}

}
