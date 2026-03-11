package com.Votify.backend.domain;

import com.Votify.backend.model.TipoCategoriaMO;

public class ProyectoSostenibilidad extends Proyecto {

    public ProyectoSostenibilidad(String nombre, String descripcion) {

        super(nombre, descripcion);

    }

    @Override
    public TipoCategoriaMO categoria() {

        return TipoCategoriaMO.SOSTENIBILIDAD;

    }
    
}
