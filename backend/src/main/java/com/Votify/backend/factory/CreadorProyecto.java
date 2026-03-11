package com.Votify.backend.factory;

import com.Votify.backend.domain.ProyectoMO;

public abstract class CreadorProyecto {

    public abstract ProyectoMO create(String nombre, String descripcion);
    
}
