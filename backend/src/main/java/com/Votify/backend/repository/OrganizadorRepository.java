package com.Votify.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.Organizador;

public interface OrganizadorRepository extends JpaRepository<Organizador, UUID> {

    boolean existsByEmail(String email);
    
}