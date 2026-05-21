package com.Votify.backend.state;

import java.time.OffsetDateTime;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

public class EstadoPausada extends EstadoVotacionBase {
    
    @Override
    public EstadoVotacionMO tipo() {
        return EstadoVotacionMO.PAUSADA;
    }

    @Override
    public void reanudar(VotacionMO votacion) {
        votacion.cambiarEstado(EstadoVotacionMO.ABIERTA);
    }

    @Override
    public void emitirVoto(VotacionMO votacion) {
        verificarExpiracion(votacion);
        if (votacion.getEstado() == EstadoVotacionMO.CERRADA) {
            votoNoPermitido("La votación ya ha finalizado.");
        }
        votoNoPermitido("La votación está pausada.");
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
