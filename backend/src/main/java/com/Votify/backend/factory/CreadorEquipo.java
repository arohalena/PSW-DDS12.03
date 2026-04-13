package com.Votify.backend.factory;

import com.Votify.backend.domain.Equipo;
import com.Votify.backend.domain.Proyecto;

public class CreadorEquipo {

    public static Equipo create(String nombre, Proyecto proyecto){
        return new Equipo(nombre, proyecto);
    }
}