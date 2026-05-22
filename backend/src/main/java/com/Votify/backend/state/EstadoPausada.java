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

        votoNoPermitido("La votacion esta pausada.");
    }

    @Override
    public boolean verificarExpiracion(VotacionMO votacion) {
        OffsetDateTime fin = votacion.getFin();
        if (fin != null && OffsetDateTime.now().isAfter(fin)) {
            cambiarEstado(votacion, EstadoVotacionMO.CERRADA);
            return true;
        }

        return false;
    }
    
}
