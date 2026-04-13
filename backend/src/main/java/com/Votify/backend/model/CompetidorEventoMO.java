package com.Votify.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "competidor_evento",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"competidor_id", "evento_id"})
    }
)
public class CompetidorEventoMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "competidor_id", nullable = false)
    private CompetidorMO competidor;

    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = false)
    private EventoMO evento;

    @ManyToOne
    @JoinColumn(name = "equipo_id", nullable = false)
    private EquipoMO equipo;
}