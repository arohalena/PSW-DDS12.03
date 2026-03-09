package com.Votify.backend.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "evento")
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = true)
    private String descripcion;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "codigo_acceso", nullable = false, unique = true)
    private String codigoAcceso;

    @Column(nullable = false)
    private String tipo;  // PUBLICO | JURADO | MIXTO

    @ManyToOne
    @JoinColumn(name = "organizador_id", nullable = false)
    private Organizador organizador;
}