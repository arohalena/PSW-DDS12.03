package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEvento;
import java.time.OffsetDateTime;

public abstract class Evento {
    
    protected String nombre;
    protected String codigoAccesoPublico;
    protected String descripcion;
    protected OffsetDateTime fecha_fin;
    protected OffsetDateTime fecha_inicio;

    public Evento(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_fin, OffsetDateTime fecha_inicio){

        this.nombre = nombre;
        this.descripcion = descripcion;
        this.codigoAccesoPublico = codigoAccesoPublico;
        this.fecha_fin = fecha_fin;
        this.fecha_inicio = fecha_inicio;

    }

    public abstract TipoEvento tipo();

    public String getNombre() {return nombre;}
    public String getCodigoAccesoPublico() {return codigoAccesoPublico;}
    public String getDescripcion() {return descripcion;}
    public OffsetDateTime getFechaFin() {return fecha_fin;}
    public OffsetDateTime getFechaInicio() {return fecha_inicio;}

}
