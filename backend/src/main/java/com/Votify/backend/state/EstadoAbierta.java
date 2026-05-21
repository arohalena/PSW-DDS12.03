package com.Votify.backend.state;

import java.time.OffsetDateTime;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

public class EstadoAbierta extends EstadoVotacionBase {
    @Override
    public EstadoVotacionMO tipo() {
        return EstadoVotacionMO.ABIERTA;
    }

    @Override
    public void abrir(VotacionMO votacion) {
        // Abrir una votación ya abierta no cambia el estado.
    }

    @Override
    public void pausar(VotacionMO votacion) {
        votacion.cambiarEstado(EstadoVotacionMO.PAUSADA);
    }

    @Override
    public void emitirVoto(VotacionMO votacion) {
        if (verificarExpiracion(votacion)) {
            votoNoPermitido("La votación ya ha finalizado.");
        }
    }

    @Override
    public boolean verificarExpiracion(VotacionMO votacion) {
        OffsetDateTime fin = votacion.getFin();
        if (fin != null && OffsetDateTime.now().isAfter(fin)) {
            votacion.cambiarEstado(EstadoVotacionMO.CERRADA);
            return true;
        }

        return false;
    }

}
