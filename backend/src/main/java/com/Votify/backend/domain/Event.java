package com.Votify.backend.domain;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public abstract class Event { //abstract product

    protected String nombre;
    protected String descripcion;
    protected LocalDateTime fechaInicio;
    protected LocalDateTime fechaFin;

    public abstract String tipoEvento();
}