package com.Votify.backend.domain;

import com.Votify.backend.model.TipoEventoMO;
import java.time.OffsetDateTime;

public abstract class Evento {
    
    protected String nombre;
    protected String codigoAccesoPublico;
    protected String descripcion;
    protected OffsetDateTime fecha_inicio;
    protected OffsetDateTime fecha_fin;
    protected boolean autoVotacion;

    public Evento(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, boolean autoVotacion){

        this.nombre = nombre;
        this.descripcion = descripcion;
        this.codigoAccesoPublico = codigoAccesoPublico;
        this.fecha_inicio = fecha_inicio;
        this.fecha_fin = fecha_fin;
        this.autoVotacion = autoVotacion;

    }

    public abstract TipoEventoMO tipo();

    public String getNombre() {return nombre;}
    public String getCodigoAccesoPublico() {return codigoAccesoPublico;}
    public String getDescripcion() {return descripcion;}
    public OffsetDateTime getFechaInicio() {return fecha_inicio;}
    public OffsetDateTime getFechaFin() {return fecha_fin;}
    public boolean isAutoVotacion() {return autoVotacion;}

}
