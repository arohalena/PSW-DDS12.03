package com.Votify.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.Evento;

public interface EventoRepository extends JpaRepository<Evento, UUID> {

    boolean existsByCodigoAcceso(String codigoAcceso);
}
