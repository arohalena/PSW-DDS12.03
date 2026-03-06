package com.Votify.backend.domain;

import com.Votify.backend.model.TipoCategoria;

public class ProyectoSostenibilidad extends Proyecto {

    public ProyectoSostenibilidad(String nombre, String descripcion) {

        super(nombre, descripcion);

    }

    @Override
    public TipoCategoria categoria() {

        return TipoCategoria.SOSTENIBILIDAD;

    }
    
}
