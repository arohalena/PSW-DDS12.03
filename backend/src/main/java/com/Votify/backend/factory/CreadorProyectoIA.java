package com.Votify.backend.factory;

import com.Votify.backend.domain.ProyectoMO;
import com.Votify.backend.domain.ProyectoIA;

public class CreadorProyectoIA extends CreadorProyecto {
    

    @Override
    public ProyectoMO create(String nombre, String descripcion){

        return  new ProyectoIA(nombre, descripcion);

    }
}
