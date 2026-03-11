package com.Votify.backend.domain;

import com.Votify.backend.model.TipoCategoriaMO;

public class ProyectoIA extends ProyectoMO {

    public ProyectoIA(String nombre, String descripcion){

        super(nombre, descripcion);

    }

    @Override
    public TipoCategoriaMO categoria() {

        return TipoCategoriaMO.IA;
        
    }
    
}
