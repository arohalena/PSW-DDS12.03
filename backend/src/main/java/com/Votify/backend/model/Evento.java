package com.Votify.backend.model;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "evento")
public class Evento extends ModeloBase {

    @Column(nullable = false)
    private String nombre;

    @Column(name= "codigo_acceso_publico", nullable = false, unique = true)
    private String codigoAccesoPublico;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private TipoEvento tipoEvento;

}
