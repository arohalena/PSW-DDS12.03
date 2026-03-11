package com.Votify.backend.factory;

import com.Votify.backend.domain.ProyectoMO;
import com.Votify.backend.domain.ProyectoSostenibilidad;

public class CreadorProyectoSostenibilidad extends CreadorProyecto {

    @Override
    public ProyectoMO create(String nombre, String descripcion) {

        return new ProyectoSostenibilidad(nombre, descripcion);

    }
}