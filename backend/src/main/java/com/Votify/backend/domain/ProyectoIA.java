package com.Votify.backend.domain;

import com.Votify.backend.model.TipoCategoria;

public class ProyectoIA extends Proyecto {

    public ProyectoIA(String nombre, String descripcion){

        super(nombre, descripcion);

    }

    @Override
    public TipoCategoria categoria() {

        return TipoCategoria.IA;
        
    }
    
}
