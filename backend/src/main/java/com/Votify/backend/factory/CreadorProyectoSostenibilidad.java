package com.Votify.backend.factory;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.domain.ProyectoSostenibilidad;

public class CreadorProyectoSostenibilidad extends CreadorProyecto {

    @Override
    public Proyecto create(String nombre, String descripcion) {

        return new ProyectoSostenibilidad(nombre, descripcion);

    }
}