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
    protected JpaRepository<EventoMO, UUID> getRepository() {
        return eventoRepository;
    }

    public EventoMO obtener(UUID id) {
        return eventoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));
    }

    public void validarDatosCreacion(String tipo, String nombre, String descripcion,
                                      OffsetDateTime fechaInicio, OffsetDateTime fechaFin) {
        if (tipo == null || tipo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se reconoce el tipo de evento deseado.");
        }
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del evento es obligatorio.");
        }
        if (descripcion == null || descripcion.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripción del evento es obligatoria.");
        }
        if (fechaInicio == null || fechaFin == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas de inicio y fin son obligatorias.");
        }
        if (fechaFin.isBefore(fechaInicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }
    }

    public EventoMO crearDesdeDominio(Evento dominio) {
        EventoMO entidad = new EventoMO();
        entidad.setNombre(dominio.getNombre());
        entidad.setCodigoAccesoPublico(dominio.getCodigoAccesoPublico());
        entidad.setDescripcion(dominio.getDescripcion());
        entidad.setTipoEvento(dominio.tipo());
        entidad.setFecha_inicio(dominio.getFechaInicio());
        entidad.setFecha_fin(dominio.getFechaFin());
        entidad.setAutoVotacion(dominio.isAutoVotacion());
        return save(entidad);
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

    public String normalizarOCrearCodigo(String codigoAccesoPublico) {
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

    public String normalizarCodigo(String codigo) {
        return codigo == null ? "" : codigo.trim().toUpperCase(Locale.ROOT);
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            builder.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return builder.toString();
    }
}