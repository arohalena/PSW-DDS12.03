package com.Votify.backend.factory.evento;

import com.Votify.backend.domain.Event;
import com.Votify.backend.domain.MixedEvent;
import com.Votify.backend.dto.EventoDTO;

public class MixedEventCreator extends EventCreator { // Concrete creator


    @Override
    public Event create(EventoDTO dto) {

        MixedEvent event = new MixedEvent();

        event.setNombre(dto.getNombre());
        event.setDescripcion(dto.getDescripcion());
        event.setFechaInicio(dto.getFechaInicio());
        event.setFechaFin(dto.getFechaFin());

        return event;
    }
}