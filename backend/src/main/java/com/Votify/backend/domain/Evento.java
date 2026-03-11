package com.Votify.backend.domain;

<<<<<<< HEAD
import com.Votify.backend.model.TipoEventoMO;
=======
import com.Votify.backend.model.TipoEvento;
import java.time.OffsetDateTime;
>>>>>>> traerCambios

public abstract class Evento {
    
    protected String nombre;
    protected String codigoAccesoPublico;
    protected String descripcion;
    protected OffsetDateTime fecha_inicio;
    protected OffsetDateTime fecha_fin;

    public Evento(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin){

        this.nombre = nombre;
        this.descripcion = descripcion;
        this.codigoAccesoPublico = codigoAccesoPublico;
        this.fecha_inicio = fecha_inicio;
        this.fecha_fin = fecha_fin;

    }

    public abstract TipoEventoMO tipo();

    public String getNombre() {return nombre;}
    public String getCodigoAccesoPublico() {return codigoAccesoPublico;}
    public String getDescripcion() {return descripcion;}
    public OffsetDateTime getFechaInicio() {return fecha_inicio;}
    public OffsetDateTime getFechaFin() {return fecha_fin;}


}
