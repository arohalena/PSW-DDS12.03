package com.Votify.backend.state;

import com.Votify.backend.model.EstadoVotacionMO;

public final class EstadoVotacionFactory {

    private static final EstadoVotacion PENDIENTE = new EstadoPendiente();
    private static final EstadoVotacion ABIERTA = new EstadoAbierta();
    private static final EstadoVotacion PAUSADA = new EstadoPausada();
    private static final EstadoVotacion CERRADA = new EstadoCerrada();

    private EstadoVotacionFactory() {
    }

    public static EstadoVotacion desde(EstadoVotacionMO estado) {
        return switch (estado) {
            case PENDIENTE -> PENDIENTE;
            case ABIERTA -> ABIERTA;
            case PAUSADA -> PAUSADA;
            case CERRADA -> CERRADA;
        };
    }
}