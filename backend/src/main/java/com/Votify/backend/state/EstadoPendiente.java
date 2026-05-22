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
        cambiarEstado(votacion, EstadoVotacionMO.ABIERTA);
    }

    @Override
    public void cerrar(VotacionMO votacion) {
        cambiarEstado(votacion, EstadoVotacionMO.CERRADA);
    }

    @Override
    public void emitirVoto(VotacionMO votacion) {
        if (verificarExpiracion(votacion)) {
            votacion.emitirVoto();
            return;
        }

        votoNoPermitido("La votacion todavia no ha comenzado.");
    }

    @Override
    public boolean verificarExpiracion(VotacionMO votacion) {
        OffsetDateTime ahora = OffsetDateTime.now();

        if (votacion.getFin() != null && ahora.isAfter(votacion.getFin())) {
            cambiarEstado(votacion, EstadoVotacionMO.CERRADA);
            return true;
        }

        if (votacion.getInicio() != null && !ahora.isBefore(votacion.getInicio())) {
            cambiarEstado(votacion, EstadoVotacionMO.ABIERTA);
            return true;
        }

        return false;
    }
}
