package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEvento;

public abstract class Evento {
    
    protected String nombre;
    protected String codigoAccesoPublico;
    protected String descripcion;

    public Evento(String nombre, String descripcion, String codigoAccesoPublico){

        this.nombre = nombre;
        this.descripcion = descripcion;
        this.codigoAccesoPublico = codigoAccesoPublico;

    }

    public abstract TipoEvento tipo();

    public String getNombre() {return nombre;}
    public String getCodigoAccesoPublico() {return codigoAccesoPublico;}
    public String getDescripcion() {return descripcion;}

}
