package com.Votify.backend.factory.evento;

import com.Votify.backend.dto.EventoDTO;

public class EventFactorySelector {

    public static EventCreator getCreator(EventoDTO dto) {

        return switch(dto.getTipoEvento()) {

            case "PUBLICO" -> new PublicVoteEventCreator();
            case "JURADO"  -> new JuryVoteEventCreator();
            case "MIXTO"   -> new MixedEventCreator();

            default -> throw new IllegalArgumentException("Tipo evento non valido");
        };
    }
}