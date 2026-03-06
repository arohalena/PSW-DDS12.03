package com.Votify.backend.factory;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.domain.ProyectoIA;

public class CreadorProyectoIA extends CreadorProyecto {
    

    @Override
    public Proyecto create(String nombre, String descripcion){

        return  new ProyectoIA(nombre, descripcion);

    }
}
