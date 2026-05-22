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
        cambiarEstado(votacion, EstadoVotacionMO.PAUSADA);
    }

    @Override
    public void cerrar(VotacionMO votacion) {
        cambiarEstado(votacion, EstadoVotacionMO.CERRADA);
    }

    @Override
    public void emitirVoto(VotacionMO votacion) {
        if (verificarExpiracion(votacion)) {
            votacion.emitirVoto();
        }
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
