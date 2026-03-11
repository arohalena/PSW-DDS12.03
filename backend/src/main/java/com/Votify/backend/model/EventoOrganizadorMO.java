package com.Votify.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "evento_organizador")
public class EventoOrganizadorMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = false)
    private EventoMO evento;

    @ManyToOne
    @JoinColumn(name = "organizador_id", nullable = false)
    private OrganizadorMO organizador;
    
}
