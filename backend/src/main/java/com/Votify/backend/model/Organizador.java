package com.Votify.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "organizador")
public class Organizador extends ModeloBase {

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String email;

}