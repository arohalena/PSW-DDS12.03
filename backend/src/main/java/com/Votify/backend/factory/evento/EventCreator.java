package com.Votify.backend.factory.evento;

import com.Votify.backend.domain.Event;
import com.Votify.backend.dto.EventoDTO;

public abstract class EventCreator { // abstract creator

    public abstract Event create( EventoDTO dto );
}