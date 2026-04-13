package com.Votify.backend.domain;

public class Equipo {

    private String nombre;
    private Proyecto proyecto;

    public Equipo(String nombre, Proyecto proyecto){
        this.nombre = nombre;
        this.proyecto = proyecto;
    }

    public String getNombre() { return nombre; }
    public Proyecto getProyecto() { return proyecto; }
}