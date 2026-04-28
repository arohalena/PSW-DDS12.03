package com.Votify.backend.service;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.factory.CreadorEvento;
import com.Votify.backend.factory.CreadorFeriaInovacion;
import com.Votify.backend.factory.CreadorHackathonEvento;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.repository.EventoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoService extends GenericService<EventoMO> {
    
    private final EventoRepository eventoRepository;

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    protected JpaRepository<EventoMO, UUID> getRepository(){

        return eventoRepository;

    }

    //Método para la creación de la factoría de evento
    public EventoMO crear(String tipo, String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin) {

        if (tipo == null || tipo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se reconoce el tipo de evento deseado.");
        }
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del evento es obligatorio.");
        }
        if (descripcion == null || descripcion.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripción del evento es obligatoria.");
        }
        if (fecha_inicio == null || fecha_fin == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas de inicio y fin son obligatorias.");
        }

        if (fecha_fin.isBefore(fecha_inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        String codigo = normalizarOCrearCodigo(codigoAccesoPublico);
        
        CreadorEvento creador = switch (tipo.trim().toUpperCase(Locale.ROOT)) {
            case "HACKATHON" -> new CreadorHackathonEvento();
            case "FERIA_INOVACION" -> new CreadorFeriaInovacion();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se reconoce el tipo de evento deseado.");
        };

        Evento eventoDominio = creador.create(nombre.trim(), descripcion.trim(), codigo, fecha_inicio, fecha_fin);

        EventoMO entidad = new EventoMO();
        entidad.setNombre(eventoDominio.getNombre());
        entidad.setCodigoAccesoPublico(eventoDominio.getCodigoAccesoPublico());
        entidad.setDescripcion(eventoDominio.getDescripcion());
        entidad.setTipoEvento(eventoDominio.tipo());
        entidad.setFecha_inicio(eventoDominio.getFechaInicio());
        entidad.setFecha_fin(eventoDominio.getFechaFin());

        return eventoRepository.save(entidad);
    }

    public String generarCodigoAccesoPublico() {
        String code;
        do {
            code = randomCode();
        } while (eventoRepository.existsByCodigoAccesoPublico(code));

        return code;
    }

    public EventoMO buscarPorCodigo(String codigo) {
        return eventoRepository.findByCodigoAccesoPublico(normalizarCodigo(codigo))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se ha encontrado ningún evento con ese código."));
    }

    private String normalizarOCrearCodigo(String codigoAccesoPublico) {
        if (codigoAccesoPublico == null || codigoAccesoPublico.isBlank()) {
        return null;
        }

        String codigo = normalizarCodigo(codigoAccesoPublico);

        if (eventoRepository.existsByCodigoAccesoPublico(codigo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ya existe un evento con ese código de acceso.");
        }

        return codigo;
    }

    private String normalizarCodigo(String codigo) {
        return codigo == null ? "" : codigo.trim().toUpperCase(Locale.ROOT);
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = RANDOM.nextInt(ALPHABET.length());
            builder.append(ALPHABET.charAt(index));
        }
        return builder.toString();
    }
}
