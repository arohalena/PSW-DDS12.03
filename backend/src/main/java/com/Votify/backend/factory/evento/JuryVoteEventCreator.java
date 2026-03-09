package com.Votify.backend.factory.evento;

import com.Votify.backend.domain.Event;
import com.Votify.backend.domain.JuryVoteEvent;
import com.Votify.backend.dto.EventoDTO;

public class JuryVoteEventCreator extends EventCreator { // Concrete creator



    @Override
    public Event create(EventoDTO dto) {
        JuryVoteEvent event = new JuryVoteEvent();

        event.setNombre(dto.getNombre());
        event.setDescripcion(dto.getDescripcion());
        event.setFechaInicio(dto.getFechaInicio());
        event.setFechaFin(dto.getFechaFin());

        return event;
    }
}