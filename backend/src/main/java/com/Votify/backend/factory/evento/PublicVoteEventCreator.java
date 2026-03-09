package com.Votify.backend.factory.evento;

import com.Votify.backend.domain.PublicVoteEvent;
import com.Votify.backend.dto.EventoDTO;
import com.Votify.backend.domain.Event;

public class PublicVoteEventCreator extends EventCreator { // Concrete creator


    @Override
    public Event create(EventoDTO dto) {
        PublicVoteEvent event = new PublicVoteEvent();
       
        event.setNombre(dto.getNombre());
        event.setDescripcion(dto.getDescripcion());
        event.setFechaInicio(dto.getFechaInicio());
        event.setFechaFin(dto.getFechaFin());

        return event;
    }
}