package com.Votify.backend.factory;

import com.Votify.backend.domain.Proyecto;

public abstract class CreadorProyecto {

    public abstract Proyecto create(String nombre, String descripcion);
    
}
