package com.Votify.backend.state;

import java.time.OffsetDateTime;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

public class EstadoPendiente extends EstadoVotacionBase{
    @Override
    public EstadoVotacionMO tipo() {
        return EstadoVotacionMO.PENDIENTE;
    }

    @Override
    public void abrir(VotacionMO votacion) {
        votacion.cambiarEstado(EstadoVotacionMO.ABIERTA);
    }

    @Override
    public void cerrar(VotacionMO votacion) {
        votacion.cambiarEstado(EstadoVotacionMO.CERRADA);
    }

    @Override
    public void emitirVoto(VotacionMO votacion) {
        verificarExpiracion(votacion);
        if (votacion.getEstado() != EstadoVotacionMO.ABIERTA) {
            votoNoPermitido("La votación todavía no ha comenzado.");
        }
    }

    @Override
    public boolean verificarExpiracion(VotacionMO votacion) {
        OffsetDateTime ahora = OffsetDateTime.now();

        if (votacion.getFin() != null && ahora.isAfter(votacion.getFin())) {
            votacion.cambiarEstado(EstadoVotacionMO.CERRADA);
            return true;
        }

        if (votacion.getInicio() != null && !ahora.isBefore(votacion.getInicio())) {
            votacion.cambiarEstado(EstadoVotacionMO.ABIERTA);
            return true;
        }

        return false;
    }
}
