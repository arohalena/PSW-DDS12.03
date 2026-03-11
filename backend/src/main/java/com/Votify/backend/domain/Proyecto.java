package com.Votify.backend.domain;

import com.Votify.backend.model.TipoCategoriaMO;


public abstract class Proyecto {

    protected String nombre;
    protected String descripcion;

    public Proyecto(String nombre, String descripcion){

        this.nombre = nombre;
        this.descripcion =  descripcion;

    }
    
    public abstract TipoCategoriaMO categoria();

    public String getNombre() {return nombre;}
    public String getDescripcion() {return descripcion;}
    
}
